"use server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole } from "@prisma/client";

export interface ExportActionResponse {
  success: boolean;
  message?: string;
  data?: string; // base64 encoded xlsx buffer
  filename?: string;
}

// ─────────────────────────────────────────────
// HELPER: áp dụng style chung cho header row
// ─────────────────────────────────────────────
function styleHeaderRow(row: ExcelJS.Row, fillColor = "1E3A5F") {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${fillColor}` },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  row.height = 22;
}

function styleCurrencyCell(cell: ExcelJS.Cell) {
  cell.numFmt = '#,##0';
  cell.alignment = { horizontal: "right" };
  cell.border = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } },
  };
}

function styleDataCell(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: "FFD0D5DD" } },
    left: { style: "thin", color: { argb: "FFD0D5DD" } },
    bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
    right: { style: "thin", color: { argb: "FFD0D5DD" } },
  };
  cell.alignment = { vertical: "middle" };
}

// ─────────────────────────────────────────────
// ACTION 1: Xuất danh sách học viên của 1 lớp
// Quyền: ADMIN hoặc CLASS_LEADER
// ─────────────────────────────────────────────
export async function exportClassStudentList(
  classId: string
): Promise<ExportActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER])) {
    return { success: false, message: "Bạn không có quyền xuất danh sách." };
  }

  // Query DB - KHÔNG lấy CCCD (Rule 3.2)
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      name: true,
      classCode: true,
      members: {
        select: {
          status: true,
          tuitionFeeActual: true,
          debtStatus: true,
          student: {
            select: {
              studentCode: true,
              fullName: true,
              phone: true,
              email: true,
              gender: true,
              // TUYỆT ĐỐI không select cccdCiphertext, cccdIv, cccdTag, cccdBlindIndex
            },
          },
        },
        orderBy: { student: { fullName: "asc" } },
      },
    },
  });

  if (!cls) {
    return { success: false, message: "Không tìm thấy lớp học." };
  }

  // Tạo workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "CiT-SMS";
  wb.created = new Date();

  const ws = wb.addWorksheet("Danh sách học viên", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Tiêu đề báo cáo
  ws.mergeCells("A1:H1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `DANH SÁCH HỌC VIÊN — ${cls.classCode}: ${cls.name}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:H2");
  const subCell = ws.getCell("A2");
  subCell.value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`;
  subCell.font = { italic: true, size: 10, color: { argb: "FF666666" } };
  subCell.alignment = { horizontal: "center" };

  // Header row
  const headers = [
    "STT",
    "Mã HV",
    "Họ và Tên",
    "SĐT",
    "Email",
    "Giới tính",
    "Trạng thái lớp",
    "Học phí thực tế (VNĐ)",
  ];
  const headerRow = ws.addRow(headers);
  styleHeaderRow(headerRow);

  // Column widths
  ws.columns = [
    { key: "stt", width: 6 },
    { key: "code", width: 16 },
    { key: "name", width: 28 },
    { key: "phone", width: 16 },
    { key: "email", width: 28 },
    { key: "gender", width: 12 },
    { key: "status", width: 18 },
    { key: "tuition", width: 22 },
  ];

  const statusLabel: Record<string, string> = {
    enrolled: "Đã đăng ký",
    studying: "Đang học",
    ON_HOLD: "Tạm hoãn",
    withdrawn: "Đã rút",
    graduated: "Tốt nghiệp",
  };

  cls.members.forEach((m, idx) => {
    const row = ws.addRow([
      idx + 1,
      m.student.studentCode ?? "",
      m.student.fullName,
      m.student.phone,
      m.student.email ?? "",
      m.student.gender ?? "",
      statusLabel[m.status] ?? m.status,
      Number(m.tuitionFeeActual),
    ]);

    row.eachCell((cell, colNumber) => {
      if (colNumber === 8) {
        styleCurrencyCell(cell);
      } else {
        styleDataCell(cell);
      }
    });
    row.height = 18;
  });

  // Freeze header rows
  ws.views = [{ state: "frozen", ySplit: 3 }];

  // Export to buffer → base64
  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `danh-sach-hv_${cls.classCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return { success: true, data: base64, filename };
}

// ─────────────────────────────────────────────
// ACTION 2: Xuất báo cáo Công nợ
// Quyền: CHỈ ADMIN
// classId tùy chọn — nếu không có thì xuất toàn bộ
// ─────────────────────────────────────────────
export async function exportDebtReport(
  classId?: string
): Promise<ExportActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return {
      success: false,
      message: "Chỉ Quản trị viên mới được phép xuất báo cáo công nợ.",
    };
  }

  // Query tất cả ClassMember (có thể lọc theo lớp)
  const members = await prisma.classMember.findMany({
    where: classId ? { classId } : undefined,
    select: {
      tuitionFeeActual: true,
      debtStatus: true,
      class: {
        select: { name: true, classCode: true },
      },
      student: {
        select: {
          studentCode: true,
          fullName: true,
          phone: true,
          // KHÔNG có CCCD (Rule 3.2)
        },
      },
      paymentReceipts: {
        where: { status: "CONFIRMED" },
        select: { amount: true },
      },
    },
    orderBy: [
      { class: { classCode: "asc" } },
      { student: { fullName: "asc" } },
    ],
  });

  // Tạo workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "CiT-SMS";
  wb.created = new Date();

  const ws = wb.addWorksheet("Báo cáo công nợ", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Tiêu đề
  ws.mergeCells("A1:I1");
  const titleCell = ws.getCell("A1");
  titleCell.value = classId
    ? "BÁO CÁO CÔNG NỢ — THEO LỚP"
    : "BÁO CÁO CÔNG NỢ — TOÀN HỆ THỐNG";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:I2");
  const subCell = ws.getCell("A2");
  subCell.value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`;
  subCell.font = { italic: true, size: 10, color: { argb: "FF666666" } };
  subCell.alignment = { horizontal: "center" };

  // Header
  const headers = [
    "STT",
    "Mã HV",
    "Họ và Tên",
    "SĐT",
    "Tên Lớp",
    "Học phí thực tế",
    "Đã đóng",
    "Còn nợ",
    "Trạng thái nợ",
  ];
  const headerRow = ws.addRow(headers);
  styleHeaderRow(headerRow, "7F1D1D"); // Đỏ đậm cho báo cáo tài chính

  // Column widths
  ws.columns = [
    { key: "stt", width: 6 },
    { key: "code", width: 16 },
    { key: "name", width: 26 },
    { key: "phone", width: 16 },
    { key: "class", width: 26 },
    { key: "tuition", width: 20 },
    { key: "paid", width: 18 },
    { key: "debt", width: 18 },
    { key: "debtStatus", width: 18 },
  ];

  const debtStatusLabel: Record<string, string> = {
    CLEAR: "Không nợ",
    PARTIAL: "Nợ một phần",
    OVERDUE: "Quá hạn",
    BAD_DEBT: "Nợ xấu",
  };

  let totalTuition = 0;
  let totalPaid = 0;
  let totalDebt = 0;

  members.forEach((m, idx) => {
    const tuition = Number(m.tuitionFeeActual);
    const paid = m.paymentReceipts.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const debt = Math.max(0, tuition - paid);

    totalTuition += tuition;
    totalPaid += paid;
    totalDebt += debt;

    const row = ws.addRow([
      idx + 1,
      m.student.studentCode ?? "",
      m.student.fullName,
      m.student.phone,
      `${m.class.classCode} — ${m.class.name}`,
      tuition,
      paid,
      debt,
      debtStatusLabel[m.debtStatus] ?? m.debtStatus,
    ]);

    row.eachCell((cell, colNumber) => {
      if ([6, 7, 8].includes(colNumber)) {
        styleCurrencyCell(cell);
        // Tô đỏ nếu còn nợ (cột 8 - Còn nợ)
        if (colNumber === 8 && debt > 0) {
          cell.font = { bold: true, color: { argb: "FFB91C1C" } };
        }
      } else {
        styleDataCell(cell);
      }
    });
    row.height = 18;
  });

  // Dòng tổng cộng
  const totalRow = ws.addRow([
    "",
    "",
    "",
    "",
    "TỔNG CỘNG",
    totalTuition,
    totalPaid,
    totalDebt,
    "",
  ]);
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
    if ([6, 7, 8].includes(colNumber)) {
      styleCurrencyCell(cell);
      cell.font = { bold: true };
    }
    cell.border = {
      top: { style: "medium" },
      left: { style: "thin", color: { argb: "FFD0D5DD" } },
      bottom: { style: "medium" },
      right: { style: "thin", color: { argb: "FFD0D5DD" } },
    };
  });
  totalRow.height = 22;

  ws.views = [{ state: "frozen", ySplit: 3 }];

  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const suffix = classId ? `_${classId.slice(0, 6)}` : "_all";
  const filename = `bao-cao-cong-no${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return { success: true, data: base64, filename };
}
