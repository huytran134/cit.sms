"use server";

import { createLeadSchema } from "@/lib/validation/lead.schema";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
// Chú ý: Nếu file kết nối DB của bạn tên khác, hãy sửa đường dẫn dưới đây cho khớp (VD: @/lib/db/prisma)
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client"; // Bắt buộc để nhận diện lỗi P2002
import { revalidatePath } from "next/cache";
import { SystemRole, LeadStatus } from "@prisma/client"; // Import Enum để check role
import { createStudent } from "@/lib/services/student.service";
import { redirect } from "next/navigation";

// Định nghĩa kiểu trả về để UI dễ xử lý
export interface ActionResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export async function createLeadAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Check permissions
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  // 2. Parse and validate form data
  const rawData = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    source: formData.get("source") || undefined,
  };

  const validation = createLeadSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: "Dữ liệu không hợp lệ.",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 3. GỌI DATABASE VÀ BẮT LỖI TRÙNG LẶP (TASK 1.2)
  try {
    await prisma.lead.create({
      data: validation.data,
    });

    revalidatePath("/leads"); // Tải lại danh sách
    return {
      success: true,
      message: "Tạo khách hàng tiềm năng thành công!",
    };

  } catch (error) {
    // BẮT LỖI TRÙNG UNIQUE KEY CỦA PRISMA (MÃ P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Kiểm tra xem phải cột 'phone' bị trùng không
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("phone")) {
          return {
            success: false,
            message: "Số điện thoại này đã tồn tại trong hệ thống!",
            errors: {
              phone: ["Số điện thoại này đã tồn tại trong hệ thống!"]
            }
          };
        }
      }
    }

    // Nếu là lỗi database khác, ném lỗi ra ngoài để hệ thống ghi log
    throw error;
  }
}

/**
 * Fetches a single lead by ID.
 */
export async function fetchLeadByIdAction(id: string) {
  const session = await getSessionForAction();
  if (!session) return null;

  return await prisma.lead.findUnique({
    where: { id },
  });
}

/**
 * Converts a Lead into a Student.
 * Task 1.6
 */
export async function convertLeadToStudentAction(
  leadId: string,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Check permissions
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN, SystemRole.CLASS_LEADER])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  try {
    // 2. Tìm Lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, message: "Không tìm thấy Lead." };
    }

    if (lead.status === LeadStatus.CONVERTED) {
      return { success: false, message: "Lead này đã được chuyển đổi trước đó." };
    }

    // 3. Tổng hợp dữ liệu từ Lead và Form
    const studentData = {
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email || undefined,
      gender: formData.get("gender") as string || undefined,
      dateOfBirth: formData.get("dateOfBirth") as string || undefined,
      cccdNumber: formData.get("cccdNumber") as string || undefined,
      consentCccd: formData.get("consentCccd") === "on",
      source: lead.source || undefined,
    };

    // 4. Gọi Service tạo Student (Service đã lo mã hóa CCCD và check trùng)
    const student = await createStudent(studentData as any);

    // 5. Cập nhật Lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.CONVERTED,
        convertedToStudentId: student.id,
      },
    });

    revalidatePath("/leads");
    return {
      success: true,
      message: "Chuyển đổi thành học viên thành công!",
    };

  } catch (error: any) {
    console.error("Conversion Error:", error);
    
    // Xử lý lỗi từ Service (Trùng SĐT/CCCD)
    if (error.message.includes("đã tồn tại")) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: "Đã có lỗi xảy ra trong quá trình chuyển đổi.",
    };
  }
}

/**
 * Fetches all leads from the database ordered by latest.
 */
export async function fetchLeadsAction() {
  const session = await getSessionForAction();
  if (!session) return [];

  return await prisma.lead.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}