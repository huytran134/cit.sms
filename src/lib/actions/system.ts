"use server";

import { prisma } from "@/lib/db";
import { getSessionForAction } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/rbac";
import { SystemRole } from "@prisma/client";

export type PurgeResult = { success: boolean; message: string };

// Thứ tự xóa từ bảng con → bảng cha để tránh vi phạm FK constraints.
// MergeHistory không có cascade → phải xóa trước Student.
export async function purgeAllBusinessData(): Promise<PurgeResult> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Phiên đăng nhập hết hạn." };
  if (!requireRole([SystemRole.ADMIN], session.user.roles)) {
    return { success: false, message: "Chỉ Admin mới có quyền thực hiện thao tác này." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.paymentReceipt.deleteMany();
        await tx.refundReceipt.deleteMany();
        await tx.attendance.deleteMany();
        await tx.feedback.deleteMany();
        await tx.classSession.deleteMany();
        await tx.classMember.deleteMany();
        await tx.classStaff.deleteMany();
        await tx.class.deleteMany();
        await tx.programPrerequisite.deleteMany();
        await tx.program.deleteMany();
        await tx.lead.deleteMany();
        await tx.mergeHistory.deleteMany();
        await tx.student.deleteMany();
      },
      { timeout: 60_000 }
    );

    // Reset AUTO_INCREMENT sau khi xóa sạch để số thứ tự bắt đầu lại từ 1.
    // Các bảng dùng cuid() làm PK nên lệnh này là no-op nhưng an toàn.
    const tables = [
      "payment_receipts",
      "refund_receipts",
      "attendances",
      "feedbacks",
      "class_sessions",
      "class_members",
      "class_staff",
      "classes",
      "program_prerequisites",
      "programs",
      "leads",
      "merge_histories",
      "students",
    ];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`
      );
    }

    return {
      success: true,
      message: "Đã xóa sạch toàn bộ dữ liệu nghiệp vụ. Tài khoản Admin và CNL vẫn nguyên vẹn.",
    };
  } catch (error) {
    console.error("[PURGE_DATA] Transaction failed:", error);
    return {
      success: false,
      message: "Xóa dữ liệu thất bại. Toàn bộ thay đổi đã được rollback.",
    };
  }
}
