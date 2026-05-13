"use server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, ReceiptStatus, StudentStatus, Prisma } from "@prisma/client";
import { encryptCCCD, hashCCCDForBlindIndex } from "@/lib/crypto/cccd";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface ImportResult {
  success: boolean;
  message: string;
  successCount: number;
  errorCount: number;
  errors: string[];
}

function generateImportReceiptCode(index: number): string {
  const timestamp = Date.now();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-IMP-${timestamp}-${index}-${suffix}`;
}

// Chuyển CellValue (có thể là Date, RichText, Formula, null...) thành string
function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("richText" in value) {
      return (value as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("");
    }
    if ("result" in value) {
      const result = (value as ExcelJS.CellFormulaValue).result;
      return result instanceof Date ? result.toISOString() : String(result ?? "");
    }
    if ("error" in value) return "";
  }
  return String(value);
}

// Chuyển CellValue thành Date — ExcelJS trả Date object trực tiếp nếu ô định dạng ngày
function cellToDate(value: ExcelJS.CellValue): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && "result" in value) {
    const r = (value as ExcelJS.CellFormulaValue).result;
    if (r instanceof Date) return r;
  }
  const parsed = new Date(cellToString(value));
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Đọc dòng header (row 1) và tạo map: tên cột → số cột (1-indexed)
function buildColumnMap(ws: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  ws.getRow(1).eachCell((cell, colNumber) => {
    const header = cellToString(cell.value).trim();
    if (header) map.set(header, colNumber);
  });
  return map;
}

/**
 * Server Action: Import học viên và lịch sử thu tiền từ file Excel.
 * Chỉ dành cho ADMIN. Hỗ trợ 2 sheet: "DanhSachHV" và "LichSuThu".
 * CCCD mã hóa AES-256-GCM. Phiếu thu import → CONFIRMED ngay lập tức.
 * Partial success: lỗi từng dòng không rollback toàn bộ.
 */
export async function importStudentAndFinanceExcel(
  formData: FormData
): Promise<ImportResult> {
  // 1. Auth check (Rule 3.3)
  const session = await getSessionForAction();
  if (!session || !assertRole(session, [SystemRole.ADMIN])) {
    return {
      success: false,
      message: "Chỉ Admin mới có quyền import dữ liệu.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  // 2. Kiểm tra file
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return {
      success: false,
      message: "Vui lòng chọn file Excel (.xlsx) để import.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
  if (!file.name.endsWith(".xlsx")) {
    return {
      success: false,
      message: "File không đúng định dạng. Vui lòng chọn file .xlsx.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: "File quá lớn. Giới hạn tối đa là 10MB.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  // 3. Đọc file Excel bằng ExcelJS (không có lỗ hổng Prototype Pollution như xlsx)
  let workbook: ExcelJS.Workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return {
      success: false,
      message: "Không thể đọc file Excel. File có thể bị hỏng.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  const errors: string[] = [];
  let successCount = 0;

  // ============================================================
  // SHEET 1: "DanhSachHV" — Import Học viên
  // Cột: HoTen | SoDienThoai | Email | CCCD | GioiTinh | NgaySinh | NoiLamViec | DiaChi
  // ============================================================
  const studentSheet = workbook.getWorksheet("DanhSachHV");
  if (studentSheet && studentSheet.rowCount > 1) {
    const colMap = buildColumnMap(studentSheet);
    const dataRows = studentSheet.getRows(2, studentSheet.rowCount - 1) ?? [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      const hoTen = cellToString(row.getCell(colMap.get("HoTen") ?? 1).value).trim();
      const soDienThoai = cellToString(row.getCell(colMap.get("SoDienThoai") ?? 2).value).trim();
      const email = cellToString(row.getCell(colMap.get("Email") ?? 3).value).trim() || null;
      const cccd = cellToString(row.getCell(colMap.get("CCCD") ?? 4).value).trim();
      const gioiTinh = cellToString(row.getCell(colMap.get("GioiTinh") ?? 5).value).trim() || null;
      const ngaySinh = cellToDate(row.getCell(colMap.get("NgaySinh") ?? 6).value);
      const noiLamViec = cellToString(row.getCell(colMap.get("NoiLamViec") ?? 7).value).trim() || null;
      const diaChi = cellToString(row.getCell(colMap.get("DiaChi") ?? 8).value).trim() || null;

      // Bỏ qua dòng trống hoàn toàn
      if (!hoTen && !soDienThoai) continue;

      if (!hoTen) {
        errors.push(`[DanhSachHV] Dòng ${rowNum}: Thiếu họ tên học viên.`);
        continue;
      }
      if (!soDienThoai) {
        errors.push(`[DanhSachHV] Dòng ${rowNum} (${hoTen}): Thiếu số điện thoại.`);
        continue;
      }

      try {
        // Check trùng SĐT
        const existingPhone = await prisma.student.findUnique({
          where: { phone: soDienThoai },
          select: { id: true },
        });
        if (existingPhone) {
          errors.push(
            `[DanhSachHV] Dòng ${rowNum} (${hoTen}): SĐT ${soDienThoai} đã tồn tại trong hệ thống.`
          );
          continue;
        }

        // Xử lý CCCD (Rule 3.2 — KHÔNG BAO GIỜ lưu plaintext)
        let cccdFields: Record<string, unknown> = {};
        if (cccd) {
          const blindIndex = hashCCCDForBlindIndex(cccd);
          const existingCccd = await prisma.student.findUnique({
            where: { cccdBlindIndex: blindIndex },
            select: { id: true },
          });
          if (existingCccd) {
            errors.push(
              `[DanhSachHV] Dòng ${rowNum} (${hoTen}): CCCD đã tồn tại trong hệ thống.`
            );
            continue;
          }
          const { ciphertext, iv, tag } = encryptCCCD(cccd);
          cccdFields = {
            cccdCiphertext: ciphertext,
            cccdIv: iv,
            cccdTag: tag,
            cccdBlindIndex: blindIndex,
            consentCccd: true,
            consentDate: new Date(),
          };
        }

        await prisma.student.create({
          data: {
            fullName: hoTen,
            phone: soDienThoai,
            email,
            gender: gioiTinh,
            dateOfBirth: ngaySinh,
            workplace: noiLamViec,
            currentAddress: diaChi,
            status: StudentStatus.ASSIGNED,
            studentCode: null,
            internalNotes: "Imported from Excel",
            ...cccdFields,
          },
        });
        successCount++;
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          errors.push(
            `[DanhSachHV] Dòng ${rowNum} (${hoTen}): Số điện thoại/CCCD đã tồn tại trong hệ thống.`
          );
        } else {
          errors.push(
            `[DanhSachHV] Dòng ${rowNum} (${hoTen}): Lỗi không xác định khi tạo học viên.`
          );
        }
      }
    }
  }

  // ============================================================
  // SHEET 2: "LichSuThu" — Import Lịch sử Thu tiền
  // Cột: SoDienThoai | MaLop | SoTien | PhuongThucTT | NgayThu | TenNguoiChuyen
  // Tất cả phiếu import → Status: CONFIRMED (đã thu tiền ngoài đời)
  // ============================================================
  const financeSheet = workbook.getWorksheet("LichSuThu");
  if (financeSheet && financeSheet.rowCount > 1) {
    const colMap = buildColumnMap(financeSheet);
    const dataRows = financeSheet.getRows(2, financeSheet.rowCount - 1) ?? [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;

      const soDienThoai = cellToString(row.getCell(colMap.get("SoDienThoai") ?? 1).value).trim();
      const maLop = cellToString(row.getCell(colMap.get("MaLop") ?? 2).value).trim();
      const soTienRaw = row.getCell(colMap.get("SoTien") ?? 3).value;
      const soTien = typeof soTienRaw === "number" ? soTienRaw : Number(cellToString(soTienRaw));
      const phuongThucTT =
        cellToString(row.getCell(colMap.get("PhuongThucTT") ?? 4).value).trim() || "cash";
      const ngayThu = cellToDate(row.getCell(colMap.get("NgayThu") ?? 5).value);
      const tenNguoiChuyen =
        cellToString(row.getCell(colMap.get("TenNguoiChuyen") ?? 6).value).trim() || null;

      // Bỏ qua dòng trống
      if (!soDienThoai && !maLop) continue;

      if (!soDienThoai) {
        errors.push(`[LichSuThu] Dòng ${rowNum}: Thiếu số điện thoại học viên.`);
        continue;
      }
      if (!maLop) {
        errors.push(`[LichSuThu] Dòng ${rowNum}: Thiếu mã lớp.`);
        continue;
      }
      if (isNaN(soTien) || soTien <= 0) {
        errors.push(`[LichSuThu] Dòng ${rowNum}: Số tiền không hợp lệ hoặc bằng 0.`);
        continue;
      }
      if (!ngayThu) {
        errors.push(`[LichSuThu] Dòng ${rowNum}: Thiếu ngày thu hoặc ngày thu không hợp lệ.`);
        continue;
      }

      try {
        const student = await prisma.student.findUnique({
          where: { phone: soDienThoai },
          select: { id: true, fullName: true },
        });
        if (!student) {
          errors.push(
            `[LichSuThu] Dòng ${rowNum}: Không tìm thấy học viên với SĐT ${soDienThoai}.`
          );
          continue;
        }

        const cls = await prisma.class.findUnique({
          where: { classCode: maLop },
          select: { id: true },
        });
        if (!cls) {
          errors.push(
            `[LichSuThu] Dòng ${rowNum}: Không tìm thấy lớp với mã "${maLop}".`
          );
          continue;
        }

        const classMember = await prisma.classMember.findUnique({
          where: { classId_studentId: { classId: cls.id, studentId: student.id } },
          select: { id: true },
        });
        if (!classMember) {
          errors.push(
            `[LichSuThu] Dòng ${rowNum}: Học viên SĐT ${soDienThoai} chưa được xếp vào lớp "${maLop}".`
          );
          continue;
        }

        // Tạo phiếu thu CONFIRMED trong transaction + ghi AuditLog
        // Rule 3.1: Phiếu import lịch sử → CONFIRMED ngay lập tức (đã thu thực tế)
        await prisma.$transaction(async (tx) => {
          const receipt = await tx.paymentReceipt.create({
            data: {
              receiptCode: generateImportReceiptCode(i),
              classMemberId: classMember.id,
              amount: soTien,
              paymentMethod: phuongThucTT,
              senderName: tenNguoiChuyen,
              paymentDate: ngayThu,
              status: ReceiptStatus.CONFIRMED,
              createdByUserId: session.user.id,
              approvedByUserId: session.user.id,
              approvedAt: new Date(),
            },
          });
          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "payment_receipt.import",
              entityType: "PaymentReceipt",
              entityId: receipt.id,
              details: JSON.stringify({
                note: "Imported from Excel",
                amount: soTien,
                classMemberId: classMember.id,
              }),
            },
          });
        });
        successCount++;
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          errors.push(
            `[LichSuThu] Dòng ${rowNum}: Phiếu thu đã tồn tại trong hệ thống (mã trùng).`
          );
        } else {
          errors.push(
            `[LichSuThu] Dòng ${rowNum}: Lỗi không xác định khi tạo phiếu thu.`
          );
        }
      }
    }
  }

  const errorCount = errors.length;
  const totalProcessed = successCount + errorCount;

  if (totalProcessed === 0) {
    return {
      success: false,
      message: "File Excel không có dữ liệu. Kiểm tra tên sheet: 'DanhSachHV', 'LichSuThu'.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  return {
    success: true,
    message: `Import hoàn tất. Thành công: ${successCount} dòng. Lỗi: ${errorCount} dòng.`,
    successCount,
    errorCount,
    errors,
  };
}
