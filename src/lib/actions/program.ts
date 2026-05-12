"use server";

import { prisma } from "@/lib/db";
import { createProgramSchema } from "@/lib/validation/program.schema";
import { getSessionForAction, assertRole } from "@/lib/auth/session";
import { SystemRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/lib/actions/lead";
import { serializeDecimal } from "@/lib/utils/serialize";

/**
 * Creates a new academic program.
 * Restricted to ADMIN role.
 * Task 2.1
 */
export async function createProgramAction(
  prevState: any,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Auth check (Strictly ADMIN only)
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Chưa đăng nhập." };
  if (!assertRole(session, [SystemRole.ADMIN])) {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  // 2. Parse form data
  const rawData: any = {
    code: formData.get("code"),
    name: formData.get("name"),
    branch: formData.get("branch"),
    feeCycle: formData.get("feeCycle"),
    type: formData.get("type"),
    tuitionFee: formData.get("tuitionFee"),
    description: formData.get("description") || undefined,
  };

  // Logic: If type is MENTORING, branch must be 'mentoring' automatically
  if (rawData.type === "MENTORING") {
    rawData.branch = "mentoring";
  }

  // 3. Validate
  const validation = createProgramSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: "Dữ liệu chương trình không hợp lệ.",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // 4. Create in DB
    await prisma.program.create({
      data: validation.data,
    });

    revalidatePath("/programs");
    return {
      success: true,
      message: "Tạo chương trình học thành công!",
    };
  } catch (error: any) {
    console.error("Create Program Error:", error);
    
    // Check for Prisma P2002 (Unique constraint)
    if (error.code === "P2002") {
      return {
        success: false,
        message: "Mã chương trình hoặc tên chương trình đã tồn tại.",
      };
    }

    return {
      success: false,
      message: "Đã có lỗi xảy ra trong quá trình tạo chương trình.",
    };
  }
}

/**
 * Fetches all programs with the count of associated classes.
 * Task 2.1
 */
export async function fetchProgramsAction() {
  const session = await getSessionForAction();
  if (!session) return [];

  const programs = await prisma.program.findMany({
    include: {
      _count: {
        select: { classes: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return serializeDecimal(programs);
}
