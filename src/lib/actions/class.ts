"use server";

import { prisma } from "@/lib/db";
import { createClassSchema } from "@/lib/validation/class.schema";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole, ClassStatus, DebtStatus, Prisma, StudentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/lib/actions/lead";
import { serializeDecimal } from "@/lib/utils/serialize";

// Sinh classCode và className theo quy chuẩn CiT EDU
function buildClassCodeAndName(
  programCode: string,
  programName: string,
  programType: string,
  year: number,
  sequence: number
): { classCode: string; className: string } {
  if (programType === "MENTORING") {
    const yearPart = String(year);
    return {
      classCode: `${programCode}_${yearPart}.${sequence}`,
      className: `${programName} ${yearPart}.${sequence}`,
    };
  }
  const yearCode = String(year - 2009).padStart(2, "0");
  return {
    classCode: `${programCode}_${yearCode}.${sequence}`,
    className: `${programName} ${yearCode}.${sequence}`,
  };
}

/**
 * Creates a new academic class with automated code generation.
 * classCode format: [ProgramCode]_[YearCode].[Seq] (REGULAR) or [ProgramCode]_[FullYear].[Seq] (MENTORING)
 * Restricted to ADMIN role.
 */
export async function createClassAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Auth check
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  // 2. Parse form data
  const rawData = {
    programId: formData.get("programId"),
    branchId: formData.get("branchId"),
    format: formData.get("format"),
    capacityMax: formData.get("capacityMax") || undefined,
    scheduleType: formData.get("scheduleType"),
    startDate: formData.get("startDate") || undefined,
  };

  // 3. Validate
  const validation = createClassSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: "Dữ liệu lớp học không hợp lệ.",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { programId, branchId, format, capacityMax, scheduleType, startDate } = validation.data;

  try {
    // 4. Fetch Program Info
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) return { success: false, message: "Không tìm thấy chương trình học." };

    const year = startDate
      ? new Date(startDate).getFullYear()
      : new Date().getFullYear();

    const isMentoring = program.type === "MENTORING";
    const yearPart = isMentoring
      ? String(year)
      : String(year - 2009).padStart(2, "0");
    const prefix = `${program.code}_${yearPart}.`;

    const finalCapacity = capacityMax || (format === "OFFLINE" ? 30 : 500);

    // 5. Transaction: đếm + tạo để tránh race condition trùng sequence
    const newClass = await prisma.$transaction(async (tx) => {
      const count = await tx.class.count({
        where: { classCode: { startsWith: prefix } },
      });
      const sequence = count + 1;
      const { classCode, className } = buildClassCodeAndName(
        program.code,
        program.name,
        program.type,
        year,
        sequence
      );

      return tx.class.create({
        data: {
          classCode,
          name: className,
          programId,
          branchId,
          tuitionFee: program.tuitionFee,
          format,
          capacityMax: finalCapacity,
          scheduleType,
          status: "PLANNED",
          ...(startDate ? { startDate: new Date(startDate) } : {}),
        },
      });
    });

    revalidatePath("/classes");
    return {
      success: true,
      message: `Tạo lớp học thành công! Mã lớp: ${newClass.classCode}`,
    };

  } catch (error: any) {
    console.error("Create Class Error:", error);
    if (error.code === "P2002") {
      return { success: false, message: "Lỗi trùng mã lớp. Vui lòng thử lại." };
    }
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình tạo lớp học." };
  }
}

/**
 * Fetches all active branches for dropdowns.
 */
export async function fetchBranchesAction() {
  const session = await getSessionForAction();
  if (!session) return [];

  return await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetches all classes with program details. Admin-only (no staff filter).
 */
export async function fetchClassesAction() {
  const session = await getSessionForAction();
  if (!session) return [];

  const classes = await prisma.class.findMany({
    include: {
      program: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return serializeDecimal(classes);
}

/**
 * Fetches only classes that the current user is assigned to as ClassStaff.
 * Used by /staff/classes to enforce data isolation for CNL/Teacher.
 */
export async function fetchClassesForStaffAction() {
  const session = await getSessionForAction();
  if (!session) return [];

  const classes = await prisma.class.findMany({
    where: {
      staff: { some: { userId: session.user.id } },
    },
    include: {
      program: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return serializeDecimal(classes);
}

/**
 * Fetches all active users with ADMIN, CLASS_LEADER, or TEACHER roles.
 * Used by Admin class detail page dropdown for staff assignment.
 */
export async function fetchStaffUsersAction() {
  const session = await getSessionForAction();
  if (!session) return [];
  if (!assertRole(session, [SystemRole.ADMIN])) return [];

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fullName: true,
      systemRoles: { select: { roleId: true } },
    },
    orderBy: { fullName: "asc" },
  });

  // Filter in application code to avoid Prisma WHERE quirks with composite-key relations
  return users.filter((u) =>
    u.systemRoles.some((r) =>
      [SystemRole.ADMIN, SystemRole.CLASS_LEADER, SystemRole.TEACHER].includes(r.roleId)
    )
  );
}

/**
 * Enrolls students into a class in bulk.
 * Task 2.3
 */
export async function enrollStudentsAction(classId: string, formData: FormData) {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: { program: { select: { type: true } } },
    });
    if (!classData) {
      return { success: false, message: "Không tìm thấy lớp học." };
    }

    // formData.getAll() lấy toàn bộ giá trị của các checkbox cùng name="studentIds"
    const studentIds = (formData.getAll("studentIds") as string[]).filter(id => id.trim() !== "");
    if (!studentIds.length) return { success: false, message: "Chưa chọn học viên nào." };

    // Kiểm tra sĩ số (Trừ lớp Mentoring)
    if (classData.program.type !== "MENTORING" && classData.capacityMax) {
      const currentCount = await prisma.classMember.count({ where: { classId } });
      if (currentCount + studentIds.length > classData.capacityMax) {
        return { success: false, message: "Vượt quá sĩ số tối đa của lớp." };
      }
    }

    // Dùng Transaction để đảm bảo tính toàn vẹn dữ liệu
    await prisma.$transaction(async (tx) => {
      // 1. Tạo ClassMembers
      await tx.classMember.createMany({
        data: studentIds.map((studentId) => ({
          classId,
          studentId: studentId.trim(),
          tuitionFeeActual: classData.tuitionFee,
          debtStatus: DebtStatus.OWING,
          status: "ENROLLED",
        })),
        skipDuplicates: true, // Nếu đã xếp rồi thì bỏ qua
      });

      // 2. Cập nhật trạng thái Student sang ASSIGNED (Đã xếp lớp)
      await tx.student.updateMany({
        where: {
          id: { in: studentIds.map(id => id.trim()) },
          status: "ASSIGNED" // Chỉ cập nhật những ai đang ở trạng thái chờ
        },
        data: { status: "STUDYING" } // Chuyển thẳng sang STUDYING vì xếp lớp xong là học luôn
      });
    });

    revalidatePath(`/admin/classes/${classId}`);
    return { success: true, message: `Đã xếp ${studentIds.length} học viên vào lớp thành công.` };

  } catch (error: any) {
    console.error("LỖI XẾP LỚP:", error);
    if (error.code === "P2002") {
      return { success: false, message: "Một số học viên đã có trong lớp này." };
    }
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình xếp lớp." };
  }
}

/**
 * Assigns a staff member to a class.
 * Task 2.4
 */
export async function assignStaffAction(
  classId: string,
  formData: FormData
): Promise<ActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;

  if (!userId || !role) {
    return { success: false, message: "Vui lòng chọn nhân sự và vai trò." };
  }

  try {
    await prisma.classStaff.create({
      data: {
        classId,
        userId,
        role,
      },
    });

    revalidatePath(`/admin/classes/${classId}`);
    return { success: true, message: "Phân công nhân sự thành công!" };
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Nhân sự này đã có vai trò này trong lớp." };
    }
    console.error("LỖI TẠO LỚP CHI TIẾT:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Lỗi không xác định"
    };
  }
}

/**
 * Kicks off a class, moving it and its members to 'IN_PROGRESS' / 'studying'.
 * Task 2.4
 */
export async function kickoffClassAction(classId: string): Promise<ActionResponse> {
  // 1. Auth check (Class Leader của lớp này hoặc Admin)
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };

  try {
    // Admin được phép kickoff mọi lớp; CNL chỉ lớp của mình
    const isAdmin = assertRole(session, [SystemRole.ADMIN]);
    const classStaff = isAdmin ? { id: "admin" } : await prisma.classStaff.findFirst({
      where: { classId, userId: session.user.id, role: "class_leader" },
    });

    if (!classStaff) {
      return { success: false, message: "Chỉ Chủ nhiệm lớp hoặc Admin mới được khai giảng." };
    }

    // 2. Fetch Class to check status
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: { members: { select: { studentId: true } } },
    });

    if (!cls) {
      return { success: false, message: "Không tìm thấy lớp học." };
    }

    if (cls.status === "IN_PROGRESS") {
      return { success: false, message: "Lớp học đã được khai giảng trước đó." };
    }

    if (!["PLANNED", "RECRUITING"].includes(cls.status)) {
      return { success: false, message: "Trạng thái lớp không hợp lệ để khai giảng." };
    }

    const studentIds = cls.members.map(m => m.studentId);

    // 3. Transaction
    await prisma.$transaction([
      // A. Update Class Status
      prisma.class.update({
        where: { id: classId },
        data: { status: ClassStatus.IN_PROGRESS, startDate: new Date() },
      }),
      // B. Update ClassMember Status
      prisma.classMember.updateMany({
        where: { classId, status: "ENROLLED" },
        data: { status: "STUDYING" },
      }),
      // C. Update Student Status
      prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: { status: StudentStatus.STUDYING },
      }),
    ]);

    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath("/admin/classes");
    return { success: true, message: "Khai giảng lớp học thành công!" };

  } catch (error: any) {
    console.error("Kickoff Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình khai giảng." };
  }
}

/**
 * Graduates a student after checking conditions (Attendance >= 80% and Paid >= 50%).
 * Task 5.2
 */
export async function graduateStudentAction(classMemberId: string): Promise<ActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    const member = await prisma.classMember.findUnique({
      where: { id: classMemberId },
      include: {
        class: { select: { id: true, tuitionFee: true } },
        student: { select: { id: true } }
      }
    });

    if (!member) return { success: false, message: "Không tìm thấy thông tin xếp lớp." };

    // 1. Calculate Attendance — Attendance lưu theo studentId + sessionId
    const totalSessions = await prisma.classSession.count({ where: { classId: member.classId, status: 'COMPLETED' } });
    const classSessionIds = await prisma.classSession.findMany({
      where: { classId: member.classId },
      select: { id: true },
    });
    const presentCount = await prisma.attendance.count({
      where: {
        studentId: member.studentId,
        sessionId: { in: classSessionIds.map(s => s.id) },
        status: { in: ['PRESENT', 'MAKEUP', 'EXCUSED'] }
      }
    });

    const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 100;

    // 2. Calculate Paid Amount
    const paidResult = await prisma.paymentReceipt.aggregate({
      where: { classMemberId, status: 'CONFIRMED' },
      _sum: { amount: true }
    });
    const totalPaid = paidResult._sum.amount?.toNumber() ?? 0;
    const paidRate = (totalPaid / member.tuitionFeeActual.toNumber()) * 100;

    // 3. Condition Check
    if (attendanceRate < 80 || paidRate < 50) {
      return {
        success: false,
        message: `Không đủ điều kiện tốt nghiệp. Chuyên cần: ${attendanceRate.toFixed(1)}%, Đã thu: ${paidRate.toFixed(1)}%.`
      };
    }

    // 4. Update
    await prisma.$transaction([
      prisma.classMember.update({
        where: { id: classMemberId },
        data: { status: 'GRADUATED' }
      }),
      prisma.student.update({
        where: { id: member.studentId },
        data: { status: StudentStatus.GRADUATED }
      }),
      prisma.class.update({
        where: { id: member.classId },
        data: { graduatedCount: { increment: 1 } }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'GRADUATE',
          entityType: 'ClassMember',
          entityId: classMemberId,
          details: JSON.stringify({ attendanceRate, paidRate })
        }
      })
    ]);

    revalidatePath(`/students/${member.studentId}`);
    return { success: true, message: "Duyệt tốt nghiệp thành công!" };

  } catch (error) {
    console.error("Graduate Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra." };
  }
}

/**
 * Withdraws a student from a class.
 * Task 5.2
 */
export async function withdrawStudentAction(classMemberId: string, reason: string): Promise<ActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  if (!reason || reason.length < 10) {
    return { success: false, message: "Lý do rút lui phải từ 10 ký tự." };
  }

  try {
    const member = await prisma.classMember.findUnique({
      where: { id: classMemberId },
      include: { student: true }
    });

    if (!member) return { success: false, message: "Không tìm thấy hồ sơ." };

    await prisma.$transaction([
      prisma.classMember.update({
        where: { id: classMemberId },
        data: { status: 'WITHDRAWN' }
      }),
      prisma.student.update({
        where: { id: member.studentId },
        data: { status: StudentStatus.WITHDRAWN }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'WITHDRAW',
          entityType: 'ClassMember',
          entityId: classMemberId,
          details: reason
        }
      })
    ]);

    revalidatePath(`/students/${member.studentId}`);
    return { success: true, message: "Đã xử lý rút lui cho học viên." };

  } catch (error) {
    console.error("Withdraw Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra." };
  }
}

/**
 * Cancels an entire class. ADMIN-only.
 * Không thể hủy lớp đã COMPLETED hoặc đã CANCELLED.
 */
export async function cancelClassAction(classId: string, reason: string): Promise<ActionResponse> {
  // 1. Auth check — CHỈ ADMIN
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  // 2. Validate reason
  if (!reason || reason.trim().length < 20) {
    return { success: false, message: "Lý do hủy lớp phải có ít nhất 20 ký tự." };
  }

  try {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return { success: false, message: "Không tìm thấy lớp học." };
    if (cls.status === ClassStatus.CANCELLED) {
      return { success: false, message: "Lớp học đã bị hủy trước đó." };
    }
    if (cls.status === ClassStatus.COMPLETED) {
      return { success: false, message: "Không thể hủy lớp đã hoàn thành." };
    }

    await prisma.class.update({
      where: { id: classId },
      data: {
        status: ClassStatus.CANCELLED,
        cancelReason: reason.trim(),
      },
    });

    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath("/admin/classes");
    return { success: true, message: "Đã hủy lớp học thành công." };

  } catch (error: any) {
    console.error("Cancel Class Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra trong quá trình hủy lớp." };
  }
}

/**
 * Puts a student's enrollment on hold.
 * Task 5.2
 */
export async function putOnHoldAction(
  classMemberId: string,
  reason: string,
  expectedReturnDate: string
): Promise<ActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    const member = await prisma.classMember.findUnique({
      where: { id: classMemberId }
    });

    if (!member) return { success: false, message: "Không tìm thấy hồ sơ." };

    await prisma.$transaction([
      prisma.classMember.update({
        where: { id: classMemberId },
        data: { 
          status: 'ON_HOLD',
          debtStatus: DebtStatus.ON_HOLD
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ON_HOLD',
          entityType: 'ClassMember',
          entityId: classMemberId,
          details: JSON.stringify({ reason, expectedReturnDate })
        }
      })
    ]);

    revalidatePath(`/students/${member.studentId}`);
    return { success: true, message: "Đã bảo lưu hồ sơ học viên." };

  } catch (error) {
    console.error("OnHold Error:", error);
    return { success: false, message: "Đã có lỗi xảy ra." };
  }
}

