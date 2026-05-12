"use server";

import { prisma } from "@/lib/db";
import { createSessionSchema } from "@/lib/validation/session.schema";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, SessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/lib/actions/lead";

/**
 * Creates a new class session.
 * Restricted to ADMIN or CLASS_LEADER role.
 * Task 3.1
 */
export async function createSessionAction(
  classId: string,
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
    sessionDate: formData.get("sessionDate"),
    topic: formData.get("topic"),
  };

  const validation = createSessionSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: "Dữ liệu không hợp lệ.",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { sessionDate, topic } = validation.data;

  try {
    // 3. Find Class and check status
    const cls = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!cls) {
      return { success: false, message: "Không tìm thấy lớp học." };
    }

    if (cls.status !== "IN_PROGRESS") {
      return { success: false, message: "Chỉ được tạo buổi học khi lớp đang hoạt động." };
    }

    // 4. Calculate sessionNumber
    const count = await prisma.classSession.count({
      where: { classId },
    });

    const sessionNumber = count + 1;

    // 5. Create Session
    await prisma.classSession.create({
      data: {
        classId,
        sessionDate: new Date(sessionDate),
        sessionNumber,
        topic: topic || "",
        status: "PLANNED",
      },
    });

    revalidatePath(`/admin/classes/${classId}/sessions`);
    revalidatePath(`/staff/classes/${classId}/sessions`);
    return { success: true, message: `Đã tạo Buổi ${sessionNumber} thành công!` };

  } catch (error: any) {
    console.error("Create Session Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình tạo buổi học." };
  }
}

/**
 * Cancels a class session.
 * Restricted to ADMIN role.
 * Task 3.1
 */
export async function cancelSessionAction(sessionId: string): Promise<ActionResponse> {
  // 1. Auth check (Strictly ADMIN)
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Chỉ quản trị viên mới được phép hủy buổi học." };
  }

  try {
    const classSession = await prisma.classSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED" },
    });

    revalidatePath(`/admin/classes/${classSession.classId}/sessions`);
    revalidatePath(`/staff/classes/${classSession.classId}/sessions`);
    return { success: true, message: "Đã hủy buổi học thành công." };
  } catch (error: any) {
    console.error("Cancel Session Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra." };
  }
}

/**
 * Fetches all sessions for a class.
 * Task 3.1
 */
export async function fetchSessionsAction(classId: string) {
  const session = await getSessionForAction();
  if (!session) return [];

  return await prisma.classSession.findMany({
    where: { classId },
    orderBy: { sessionDate: "asc" },
  });
}

/**
 * Tự động tạo lịch học cho 21 ngày tiếp theo dựa trên các ngày trong tuần được chọn.
 * Bỏ qua ngày đã có buổi học, không tạo trùng.
 * Quyền: ADMIN hoặc CLASS_LEADER.
 * Task 3.3
 */
export async function generateClassSessions(
  classId: string,
  scheduleDays: number[] = [2, 4, 6] // Mặc định: Thứ 3, 5, 7 (JS getDay(): 0=CN, 1=T2, ..., 6=T7)
): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    // 2. Kiểm tra lớp học tồn tại và đang hoạt động
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return { success: false, message: "Không tìm thấy lớp học." };
    }
    if (cls.status !== "IN_PROGRESS") {
      return { success: false, message: "Chỉ tạo lịch cho lớp đang hoạt động (IN_PROGRESS)." };
    }

    // 3. Tính ra các ngày ứng viên trong 21 ngày tới (từ ngày mai trở đi)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const candidateDates: Date[] = [];
    for (let i = 1; i <= 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (scheduleDays.includes(d.getDay())) {
        candidateDates.push(d);
      }
    }

    if (candidateDates.length === 0) {
      return { success: false, message: "Không có ngày học nào phù hợp trong 21 ngày tới theo lịch đã chọn." };
    }

    // 4. Lấy các buổi học đã tồn tại trong khoảng thời gian đó để tránh trùng lặp
    const rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() + 1);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(today.getDate() + 21);
    rangeEnd.setHours(23, 59, 59, 999);

    const existingSessions = await prisma.classSession.findMany({
      where: {
        classId,
        sessionDate: { gte: rangeStart, lte: rangeEnd },
      },
      select: { sessionDate: true },
    });

    // Build set của các ngày đã có (định dạng YYYY-MM-DD)
    const existingDateSet = new Set(
      existingSessions.map((s) => s.sessionDate.toISOString().split("T")[0])
    );

    // 5. Lọc ra các ngày chưa có buổi học
    const newDates = candidateDates.filter(
      (d) => !existingDateSet.has(d.toISOString().split("T")[0])
    );

    if (newDates.length === 0) {
      return {
        success: false,
        message: "Không có buổi học mới cần tạo. Lịch đã được tạo đủ cho 3 tuần tới.",
      };
    }

    // 6. Lấy sessionNumber lớn nhất hiện tại để tự tăng tiếp theo
    const aggregate = await prisma.classSession.aggregate({
      where: { classId },
      _max: { sessionNumber: true },
    });
    let nextSessionNumber = (aggregate._max.sessionNumber ?? 0) + 1;

    // Sắp xếp ngày tăng dần trước khi tạo
    newDates.sort((a, b) => a.getTime() - b.getTime());

    // 7. Tạo hàng loạt các buổi học mới
    await prisma.classSession.createMany({
      data: newDates.map((date) => {
        const sessionDate = new Date(date);
        sessionDate.setHours(8, 0, 0, 0); // Mặc định 8:00 sáng
        return {
          classId,
          sessionDate,
          sessionNumber: nextSessionNumber++,
          status: SessionStatus.PLANNED,
        };
      }),
    });

    revalidatePath(`/admin/classes/${classId}/sessions`);
    revalidatePath(`/staff/classes/${classId}/sessions`);
    return {
      success: true,
      message: `Đã tạo thành công ${newDates.length} buổi học mới.`,
    };
  } catch (error: any) {
    console.error("Generate Sessions Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra khi tạo lịch học tự động." };
  }
}
