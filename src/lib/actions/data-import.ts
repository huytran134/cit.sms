"use server";

import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, ReceiptStatus, StudentStatus, Prisma } from "@prisma/client";
import { encryptCCCD, hashCCCDForBlindIndex } from "@/lib/crypto/cccd";

export interface ImportResult {
  success: boolean;
  message: string;
  successCount: number;
  errorCount: number;
  errors: string[];
}

// Tạo receipt code duy nhất cho phiếu thu import
function generateImportReceiptCode(index: number): string {
  const timestamp = Date.now();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-IMP-${timestamp}-${index}-${suffix}`;
}

/**
 * Server Action: Import học viên và lịch sử thu tiền từ file Excel.
 * Chỉ dành cho ADMIN. Hỗ trợ 2 sheet: "DanhSachHV" và "LichSuThu".
 * Tuân thủ quy tắc: CCCD mã hóa AES-256-GCM, Phiếu thu import -> CONFIRMED ngay lập tức.
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

  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return {
      success: false,
      message: "File không đúng định dạng. Vui lòng chọn file .xlsx.",
      successCount: 0,
      errorCount: 0,
      errors: [],
    };
  }

  // 3. Đọc file Excel
  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
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
  const studentSheet = workbook.Sheets["DanhSachHV"];
  if (studentSheet) {
    type StudentRow = {
      HoTen?: string;
      SoDienThoai?: string;
      Email?: string;
      CCCD?: string;
      GioiTinh?: string;
      NgaySinh?: string | Date;
      NoiLamViec?: string;
      DiaChi?: string;
    };

    const rows = XLSX.utils.sheet_to_json<StudentRow>(studentSheet, {
      defval: "",
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 vì header ở dòng 1, data bắt đầu từ dòng 2

      const hoTen = String(row.HoTen || "").trim();
      const soDienThoai = String(row.SoDienThoai || "").trim();
      const email = String(row.Email || "").trim() || null;
      const cccd = String(row.CCCD || "").trim();
      const gioiTinh = String(row.GioiTinh || "").trim() || null;
      const ngaySinhRaw = row.NgaySinh;
      const noiLamViec = String(row.NoiLamViec || "").trim() || null;
      const diaChi = String(row.DiaChi || "").trim() || null;

      // Bỏ qua dòng trống hoàn toàn
      if (!hoTen && !soDienThoai) continue;

      // Validate bắt buộc
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

          // Check trùng Blind Index
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

          // Mã hóa AES-256-GCM
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

        // Parse ngày sinh
        let dateOfBirth: Date | null = null;
        if (ngaySinhRaw) {
          const parsed = new Date(ngaySinhRaw as string);
          if (!isNaN(parsed.getTime())) {
            dateOfBirth = parsed;
          }
        }

        await prisma.student.create({
          data: {
            fullName: hoTen,
            phone: soDienThoai,
            email,
            gender: gioiTinh,
            dateOfBirth,
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
  // Tất cả phiếu import -> Status: CONFIRMED (đã thu tiền ngoài đời)
  // ============================================================
  const financeSheet = workbook.Sheets["LichSuThu"];
  if (financeSheet) {
    type FinanceRow = {
      SoDienThoai?: string;
      MaLop?: string;
      SoTien?: number | string;
      PhuongThucTT?: string;
      NgayThu?: string | Date;
      TenNguoiChuyen?: string;
    };

    const rows = XLSX.utils.sheet_to_json<FinanceRow>(financeSheet, {
      defval: "",
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const soDienThoai = String(row.SoDienThoai || "").trim();
      const maLop = String(row.MaLop || "").trim();
      const soTien = Number(row.SoTien);
      const phuongThucTT = String(row.PhuongThucTT || "cash").trim();
      const ngayThuRaw = row.NgayThu;
      const tenNguoiChuyen = String(row.TenNguoiChuyen || "").trim() || null;

      // Bỏ qua dòng trống
      if (!soDienThoai && !maLop) continue;

      // Validate
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
      if (!ngayThuRaw) {
        errors.push(`[LichSuThu] Dòng ${rowNum}: Thiếu ngày thu.`);
        continue;
      }

      const ngayThu = new Date(ngayThuRaw as string);
      if (isNaN(ngayThu.getTime())) {
        errors.push(`[LichSuThu] Dòng ${rowNum}: Ngày thu không hợp lệ.`);
        continue;
      }

      try {
        // Tìm học viên theo SĐT
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

        // Tìm lớp theo mã lớp
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

        // Tìm ClassMember (học viên phải có trong lớp)
        const classMember = await prisma.classMember.findUnique({
          where: {
            classId_studentId: { classId: cls.id, studentId: student.id },
          },
          select: { id: true },
        });
        if (!classMember) {
          errors.push(
            `[LichSuThu] Dòng ${rowNum}: Học viên SĐT ${soDienThoai} chưa được xếp vào lớp "${maLop}".`
          );
          continue;
        }

        // Tạo phiếu thu CONFIRMED trong transaction + ghi AuditLog
        // Rule 3.1: Phiếu import lịch sử -> CONFIRMED ngay lập tức (đã thu thực tế)
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

          // Ghi AuditLog bắt buộc cho mọi phiếu import
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
