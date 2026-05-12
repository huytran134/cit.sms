"use server";

import { createStudentSchema } from "@/lib/validation/student.schema";
import { createStudent } from "@/lib/services/student.service";
import { ActionResponse } from "@/lib/actions/lead";
import { prisma } from "@/lib/db";
import { SystemRole } from "@prisma/client";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { serializeDecimal } from "@/lib/utils/serialize";
import { decryptCCCD, EncryptedData } from "@/lib/crypto/cccd";
import { revalidatePath } from "next/cache";

/**
 * Public Server Action to handle Student self-registration.
 * This is an unauthenticated route for potential students.
 */
export async function registerStudentAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Parse and validate form data
  const rawData = {
    fullName: formData.get("fullName"),
    gender: formData.get("gender") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    cccdNumber: formData.get("cccdNumber") || undefined,
    consentCccd: formData.get("consentCccd") === "true",
  };

  const validation = createStudentSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: "Vui lòng kiểm tra lại thông tin đăng ký.",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 2. Call Service Layer to encrypt and save
  try {
    await createStudent(validation.data);

    return {
      success: true,
      message: "Đăng ký thông tin học viên thành công! Chúng tôi sẽ sớm liên hệ với bạn.",
    };
  } catch (error: any) {
    // Catch service errors (Duplicate Phone, Duplicate CCCD, etc.)
    return {
      success: false,
      message: error.message || "Đã có lỗi xảy ra trong quá trình đăng ký.",
    };
  }
}

/**
 * Fetches students for the list view.
 * Task 1.7
 */
export async function fetchStudentsAction() {
  const session = await getSessionForAction();
  if (!session) return [];

  return await prisma.student.findMany({
    select: {
      id: true,
      studentCode: true,
      fullName: true,
      phone: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Fetches a single student by ID, excluding sensitive crypto fields.
 * Task 1.7
 */
export async function fetchStudentByIdAction(id: string) {
  const session = await getSessionForAction();
  if (!session) return null;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          class: {
            select: {
              name: true,
              classCode: true,
            },
          },
          paymentReceipts: {
            where: {
              status: "CONFIRMED",
            },
            select: {
              amount: true,
            },
          },
        },
      },
    },
  });
  return serializeDecimal(student);
}

/**
 * Securely decrypts and returns the CCCD for an Admin.
 * Logs the access.
 * Task 1.7
 */
export async function viewCCCDAction(studentId: string) {
  // 1. Auth check (Strictly ADMIN only — Rule 3.2: phải log userId thật)
  const session = await getSessionForAction();
  if (!session) throw new Error("Chưa đăng nhập.");
  if (!assertRole(session, [SystemRole.ADMIN])) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }

  try {
    // 2. Fetch the student with crypto fields
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        cccdCiphertext: true,
        cccdIv: true,
        cccdTag: true,
      },
    });

    if (!student || !student.cccdCiphertext || !student.cccdIv || !student.cccdTag) {
      throw new Error("Học viên này chưa có CCCD.");
    }

    // 3. Log Audit
    await prisma.cccdAccessLog.create({
      data: {
        userId: session.user.id,
        studentId: studentId,
      },
    });

    // 4. Decrypt
    const cryptoData: EncryptedData = {
      ciphertext: student.cccdCiphertext,
      iv: student.cccdIv,
      tag: student.cccdTag,
    };

    const plainTextCCCD = decryptCCCD(cryptoData);

    return {
      success: true,
      cccd: plainTextCCCD,
    };

  } catch (error: any) {
    console.error("View CCCD Error:", error);
    throw error;
  }
}
