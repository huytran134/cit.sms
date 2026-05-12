"use server";

import { prisma } from "@/lib/db";
import { publicFeedbackSchema } from "@/lib/validation/feedback.schema";
import { revalidatePath } from "next/cache";

export async function submitPublicFeedbackAction(sessionId: string, prevState: any, formData: FormData) {
  try {
    const validation = publicFeedbackSchema.safeParse(Object.fromEntries(formData));
    if (!validation.success) {
      return { success: false, message: "Dữ liệu không hợp lệ", errors: validation.error.flatten().fieldErrors };
    }

    const data = validation.data;

    const sessionData = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { class: { select: { name: true } } }
    });

    if (!sessionData || sessionData.status !== "COMPLETED") {
      return { success: false, message: "Buổi học không hợp lệ hoặc chưa kết thúc." };
    }

    await prisma.feedback.create({
      data: {
        session: { connect: { id: sessionId } },
        lessonRating: data.lessonRating,
        teacherRating: data.teacherRating,
        taRating: data.taRating,
        comment: `[HV: ${data.guestName}${data.guestPhone ? " - " + data.guestPhone : ""}] ${data.comment || ""}`
      }
    });

    revalidatePath(`/portal/feedback/${sessionId}`);
    return { success: true, message: "Cảm ơn bạn đã đánh giá!" };

  } catch (error: any) {
    console.error("LỖI FEEDBACK:", error);
    return { success: false, message: "Đã có lỗi xảy ra khi lưu đánh giá." };
  }
}

/**
 * Cần thiết cho UI Portal để lấy thông tin buổi học từ Client Component
 */
export async function fetchSessionForFeedbackAction(sessionId: string) {
  return await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: { name: true, classCode: true }
      }
    }
  });
}
