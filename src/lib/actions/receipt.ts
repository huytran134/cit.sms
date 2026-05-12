"use server";

import { prisma } from "@/lib/db";
import { createReceiptSchema } from "@/lib/validation/receipt.schema";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, ReceiptStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/lib/actions/lead";

/**
 * Creates a new payment receipt with PENDING_APPROVAL status.
 * Restricted to ADMIN or CLASS_LEADER role.
 * Task 4.1
 */
export async function createReceiptAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  // 2. Parse and Validate
  const rawData = {
    classMemberId: formData.get("classMemberId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    senderName: formData.get("senderName"),
    senderBankAccount: formData.get("senderBankAccount"),
    senderNote: formData.get("senderNote"),
    paymentDate: formData.get("paymentDate"),
  };

  const validation = createReceiptSchema.safeParse(rawData);
  if (!validation.success) {
    console.log("LỖI ZOD CHI TIẾT:", validation.error.flatten().fieldErrors); // THÊM DÒNG NÀY
    return {
      success: false,
      message: "Dữ liệu không hợp lệ.",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = validation.data;

  try {
    // 3. Find ClassMember
    const classMember = await prisma.classMember.findUnique({
      where: { id: data.classMemberId },
      include: { class: true },
    });

    if (!classMember) {
      return { success: false, message: "Không tìm thấy thông tin xếp lớp của học viên." };
    }

    // 4. Create Receipt
    await prisma.paymentReceipt.create({
      data: {
        receiptCode: `PT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        classMemberId: data.classMemberId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        senderName: data.senderName,
        senderBankAccount: data.senderBankAccount,
        senderNote: data.senderNote,
        paymentDate: new Date(data.paymentDate),
        status: ReceiptStatus.PENDING_APPROVAL,
        createdByUserId: session.user.id,
      },
    });

    revalidatePath(`/admin/classes/${classMember.classId}/finance`);
    revalidatePath(`/staff/classes/${classMember.classId}/finance`);
    return {
      success: true,
      message: "Đã nhập phiếu thu thành công. Đang chờ Admin duyệt."
    };

  } catch (error: any) {
    console.error("Create Receipt Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình tạo phiếu thu." };
  }
}

/**
 * Approves multiple payment receipts and recalculates debt status.
 * Restricted to ADMIN role.
 * Task 4.2
 */
export async function approveReceiptsAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Chỉ Admin mới có quyền duyệt phiếu thu." };
  }

  // 2. Get IDs
  const rawIds = formData.get("receiptIds") as string;
  if (!rawIds) return { success: false, message: "Vui lòng chọn ít nhất một phiếu thu." };

  const receiptIds = rawIds.split(",").filter(id => id.trim() !== "");

  try {
    // 3. Find affected members before transaction to ensure we have the list
    const receipts = await prisma.paymentReceipt.findMany({
      where: { id: { in: receiptIds } },
      select: { classMemberId: true },
    });
    
    const memberIds = Array.from(new Set(receipts.map(r => r.classMemberId)));

    // 4. Atomic Transaction
    await prisma.$transaction(async (tx) => {
      // Step A: Update Receipts
      await tx.paymentReceipt.updateMany({
        where: { 
          id: { in: receiptIds },
          status: ReceiptStatus.PENDING_APPROVAL
        },
        data: {
          status: ReceiptStatus.CONFIRMED,
          approvedByUserId: session.user.id,
          approvedAt: new Date(),
        },
      });

      // Step B: Recalculate Debt for each affected member
      for (const memberId of memberIds) {
        // Sum all confirmed receipts
        const aggregate = await tx.paymentReceipt.aggregate({
          where: {
            classMemberId: memberId,
            status: ReceiptStatus.CONFIRMED,
          },
          _sum: {
            amount: true,
          },
        });

        const totalPaid = aggregate._sum.amount || 0;

        // Get actual tuition
        const member = await tx.classMember.findUnique({
          where: { id: memberId },
          select: { tuitionFeeActual: true },
        });

        if (member) {
          const isCleared = totalPaid >= member.tuitionFeeActual;
          await tx.classMember.update({
            where: { id: memberId },
            data: {
              debtStatus: isCleared ? "CLEAR" : "OWING",
            },
          });
        }
      }
    });

    revalidatePath("/finance/approvals");
    revalidatePath("/classes");
    return { 
      success: true, 
      message: `Đã duyệt thành công ${receiptIds.length} phiếu thu và cập nhật công nợ.` 
    };

  } catch (error: any) {
    console.error("Approve Receipts Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình duyệt phiếu thu." };
  }
}

/**
 * Cancels a payment receipt and recalculates debt status.
 * Restricted to ADMIN role.
 * Task 4.3
 */
export async function cancelReceiptAction(
  receiptId: string,
  reason: string
): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Chỉ Admin mới có quyền hủy phiếu thu." };
  }

  // 2. Validate reason
  if (!reason || reason.trim().length < 20) {
    return { success: false, message: "Lý do hủy phải có ít nhất 20 ký tự." };
  }

  try {
    // 3. Find Receipt
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: { classMember: true },
    });

    if (!receipt) return { success: false, message: "Không tìm thấy phiếu thu." };
    if (receipt.status === ReceiptStatus.CANCELLED) {
      return { success: false, message: "Phiếu này đã bị hủy trước đó." };
    }

    const memberId = receipt.classMemberId;
    const wasConfirmed = receipt.status === ReceiptStatus.CONFIRMED;

    // 4. Transaction
    await prisma.$transaction(async (tx) => {
      // Step A: Update Receipt
      await tx.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          status: ReceiptStatus.CANCELLED,
          senderNote: `${receipt.senderNote || ""} [Hủy bởi Admin: ${reason}]`.trim(),
        },
      });

      // Step B: Recalculate Debt only if the cancelled receipt was previously confirmed
      if (wasConfirmed) {
        const aggregate = await tx.paymentReceipt.aggregate({
          where: {
            classMemberId: memberId,
            status: ReceiptStatus.CONFIRMED,
          },
          _sum: { amount: true },
        });

        const totalPaid = aggregate._sum.amount || 0;
        const member = await tx.classMember.findUnique({
          where: { id: memberId },
          select: { tuitionFeeActual: true },
        });

        if (member) {
          const isCleared = totalPaid >= member.tuitionFeeActual;
          await tx.classMember.update({
            where: { id: memberId },
            data: {
              debtStatus: isCleared ? "CLEAR" : "OWING",
            },
          });
        }
      }
    });

    revalidatePath("/finance/approvals");
    revalidatePath("/classes");
    return { success: true, message: "Đã hủy phiếu thu thành công và cập nhật lại công nợ." };

  } catch (error: any) {
    console.error("Cancel Receipt Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình hủy phiếu thu." };
  }
}

/**
 * Creates a refund receipt.
 * Restricted to ADMIN role.
 * Task 4.3
 */
export async function createRefundAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Chỉ Admin mới có quyền tạo phiếu hoàn tiền." };
  }

  // 2. Parse & Validate
  const classMemberId = formData.get("classMemberId") as string;
  const amount = Number(formData.get("amount"));
  const reason = formData.get("reason") as string;

  if (!classMemberId) return { success: false, message: "Vui lòng chọn học viên." };
  if (isNaN(amount) || amount <= 0) return { success: false, message: "Số tiền hoàn phải lớn hơn 0." };
  if (!reason || reason.trim().length < 20) {
    return { success: false, message: "Lý do hoàn tiền phải có ít nhất 20 ký tự." };
  }

  try {
    // 3. Find ClassMember and Program Type
    const member = await prisma.classMember.findUnique({
      where: { id: classMemberId },
      include: {
        class: {
          include: { program: true },
        },
      },
    });

    if (!member) return { success: false, message: "Không tìm thấy thông tin xếp lớp." };
    
    // Check if Mentoring
    if (member.class.program.type === "MENTORING") {
      return { success: false, message: "Lớp Mật Thất không hỗ trợ hoàn tiền." };
    }

    // 4. Create Refund
    await prisma.refundReceipt.create({
      data: {
        receiptCode: `HOAN-${Date.now()}`,
        classMemberId,
        amount,
        reason,
        refundMethod: formData.get("refundMethod") as string || "TRANSFER",
        status: "APPROVED",
        approvedByUserId: session.user.id,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/finance/refunds");
    return { success: true, message: "Đã tạo phiếu hoàn tiền thành công." };

  } catch (error: any) {
    console.error("Create Refund Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình hoàn tiền." };
  }
}


