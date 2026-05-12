"use server";

import { prisma } from "@/lib/db";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, DebtStatus, ReceiptStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * Marks a student's debt as BAD_DEBT if there's remaining balance.
 * Task 5.3
 */
export async function markAsBadDebtAction(classMemberId: string, reason: string): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  if (!reason || reason.length < 10) {
    return { success: false, message: "Vui lòng nhập lý do cụ thể (tối thiểu 10 ký tự)." };
  }

  try {
    // 2. Fetch ClassMember and Confirmed Receipts
    const member = await prisma.classMember.findUnique({
      where: { id: classMemberId },
      include: {
        paymentReceipts: {
          where: { status: ReceiptStatus.CONFIRMED }
        }
      }
    });

    if (!member) return { success: false, message: "Không tìm thấy hồ sơ học viên." };

    // 3. Logic core
    const totalPaid = member.paymentReceipts.reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const remainingDebt = member.tuitionFeeActual.toNumber() - totalPaid;

    const newStatus = remainingDebt > 0 ? DebtStatus.BAD_DEBT : DebtStatus.CLEAR;

    // 4. Update & Log
    await prisma.$transaction([
      prisma.classMember.update({
        where: { id: classMemberId },
        data: { debtStatus: newStatus }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'MARK_BAD_DEBT',
          entityType: 'ClassMember',
          entityId: classMemberId,
          details: JSON.stringify({
            reason,
            remainingDebt,
            previousStatus: member.debtStatus
          })
        }
      })
    ]);

    revalidatePath(`/students/${member.studentId}`);
    return { 
      success: true, 
      message: newStatus === DebtStatus.BAD_DEBT 
        ? "Đã đánh dấu công nợ xấu thành công." 
        : "Học viên đã hoàn thành học phí, trạng thái được chuyển về CLEAR." 
    };

  } catch (error) {
    console.error("Mark Bad Debt Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình xử lý." };
  }
}
