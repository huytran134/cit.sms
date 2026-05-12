"use server";

import { prisma } from "@/lib/db";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, AttendanceStatus, SessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/lib/actions/lead";

/**
 * Records attendance for a class session.
 * Task 3.2
 */
export async function recordAttendanceAction(
  sessionId: string,
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  if (!formData) throw new Error("Dữ liệu form bị thiếu. Vui lòng tải lại trang.");

  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER, SystemRole.TEACHER])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    // 2. Find Session
    const classSession = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!classSession) {
      return { success: false, message: "Không tìm thấy buổi học." };
    }

    if (classSession.status !== SessionStatus.PLANNED) {
      return { success: false, message: "Buổi học này không thể điểm danh." };
    }

    // 3. Parse attendance data from FormData
    // Keys: attendance-{studentId}, Value: PRESENT|ABSENT|EXCUSED|MAKEUP
    const attendanceUpdates: { studentId: string; status: AttendanceStatus }[] = [];
    
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("attendance-")) {
        const studentId = key.replace("attendance-", "");
        attendanceUpdates.push({
          studentId,
          status: value as AttendanceStatus,
        });
      }
    }

    if (attendanceUpdates.length === 0) {
      return { success: false, message: "Không có dữ liệu điểm danh nào được gửi." };
    }

    // 4. DB Operations (Upsert each record and update session status)
    await prisma.$transaction(async (tx) => {
      for (const update of attendanceUpdates) {
        await tx.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: update.studentId,
            },
          },
          update: { status: update.status },
          create: {
            sessionId,
            studentId: update.studentId,
            status: update.status,
          },
        });
      }

      // 5. Update Session status to COMPLETED
      await tx.classSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.COMPLETED },
      });
    });

    revalidatePath(`/classes/${classSession.classId}/sessions/${sessionId}/attendance`);
    revalidatePath(`/classes/${classSession.classId}/sessions`);
    
    return {
      success: true,
      message: "Lưu điểm danh thành công!",
    };

  } catch (error: any) {
    console.error("Record Attendance Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình điểm danh." };
  }
}

/**
 * Fetches class members and their current attendance for a session.
 * Task 3.2
 */
export async function fetchStudentsForSessionAction(sessionId: string) {
  const authSession = await getSessionForAction();
  if (!authSession) return [];

  const classSession = await prisma.classSession.findUnique({
    where: { id: sessionId },
    select: { classId: true },
  });

  if (!classSession) return [];

  const members = await prisma.classMember.findMany({
    where: { classId: classSession.classId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
    orderBy: {
      student: {
        fullName: "asc",
      },
    },
  });

  const existingAttendance = await prisma.attendance.findMany({
    where: { sessionId },
  });

  const attendanceMap = new Map(existingAttendance.map((a) => [a.studentId, a.status]));

  return members.map((m) => ({
    studentId: m.studentId,
    fullName: m.student.fullName,
    phone: m.student.phone,
    currentStatus: attendanceMap.get(m.studentId) || "PRESENT",
  }));
}
