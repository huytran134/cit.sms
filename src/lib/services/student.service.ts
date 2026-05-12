import { prisma } from "@/lib/db";
import { encryptCCCD, hashCCCDForBlindIndex } from "@/lib/crypto/cccd";
import { CreateStudentInput } from "@/lib/validation/student.schema";
import { StudentStatus } from "@prisma/client";

/**
 * Service to handle Student creation with security measures (Encryption & Blind Index).
 * Follows Task 1.4 requirements.
 */
export async function createStudent(data: CreateStudentInput) {
  const { phone, cccdNumber, consentCccd, ...otherData } = data;

  try {
    // Step 1: Check for duplicate phone number
    const existingPhone = await prisma.student.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      throw new Error("Số điện thoại này đã tồn tại trong danh sách học viên");
    }

    let cccdFields = {};

    // Step 2: Handle CCCD encryption and blind indexing if provided
    if (cccdNumber && cccdNumber.trim() !== "") {
      // 2.1 Create and check Blind Index
      const blindIndex = hashCCCDForBlindIndex(cccdNumber);

      const existingCccd = await prisma.student.findUnique({
        where: { cccdBlindIndex: blindIndex },
      });

      if (existingCccd) {
        throw new Error("Số CCCD này đã tồn tại trong hệ thống");
      }

      // 2.2 Encrypt the CCCD
      // RED RULE: No logging of cccdNumber or encryption results
      const { ciphertext, iv, tag } = encryptCCCD(cccdNumber);

      cccdFields = {
        cccdCiphertext: ciphertext,
        cccdIv: iv,
        cccdTag: tag,
        cccdBlindIndex: blindIndex,
        consentCccd: true,
        consentDate: new Date(),
      };
    }

    // Chuyển đổi định dạng ngày sinh cho Prisma
    const payload = {
      ...otherData,
      phone,
      status: StudentStatus.ASSIGNED, // Dùng Enum như đã sửa ở bước trước
      studentCode: null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      ...cccdFields,
    };

    // Step 3: Create the Student record
    const student = await prisma.student.create({
      data: payload,
    });

    return student;
  } catch (error) {
    // Forward the error to be handled by the caller (Server Action)
    throw error;
  }
}
