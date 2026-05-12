"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSessionForAction } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/rbac";
import { SystemRole } from "@prisma/client";
import { createStaffSchema, updateUserInfoSchema } from "@/lib/validation/user.schema";

export type UserActionResponse = { success: boolean; message: string };

export async function createStaffAction(
  _prev: UserActionResponse | null,
  formData: FormData
): Promise<UserActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Phiên đăng nhập hết hạn." };
  if (!requireRole([SystemRole.ADMIN], session.user.roles)) {
    return { success: false, message: "Chỉ Admin mới có quyền tạo tài khoản." };
  }

  const raw = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
    return { success: false, message: firstError };
  }

  const { fullName, email, phone, password, role } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { fullName, email, phone, passwordHash, isActive: true },
    });

    await prisma.userSystemRole.create({
      data: {
        userId: user.id,
        roleId: role as SystemRole,
        role: role as SystemRole,
      },
    });

    revalidatePath("/admin/settings/users");
    return { success: true, message: `Tạo tài khoản "${fullName}" thành công.` };
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return { success: false, message: "Số điện thoại/CCCD đã tồn tại trong hệ thống" };
    }
    return { success: false, message: "Lỗi hệ thống, vui lòng thử lại sau." };
  }
}

export async function fetchStaffUsersAction() {
  const session = await getSessionForAction();
  if (!session || !requireRole([SystemRole.ADMIN], session.user.roles)) return [];

  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      systemRoles: {
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleStaffActiveAction(
  userId: string,
  isActive: boolean
): Promise<UserActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Phiên đăng nhập hết hạn." };
  if (!requireRole([SystemRole.ADMIN], session.user.roles)) {
    return { success: false, message: "Không có quyền thực hiện." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (target?.email === "admin@citedu.vn") {
    return { success: false, message: "Không thể chỉnh sửa tài khoản Super Admin." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  revalidatePath("/admin/settings/users");
  return {
    success: true,
    message: isActive ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản.",
  };
}

export async function updateUserRolesAction(
  userId: string,
  newRoles: SystemRole[]
): Promise<UserActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Phiên đăng nhập hết hạn." };
  if (!requireRole([SystemRole.ADMIN], session.user.roles)) {
    return { success: false, message: "Không có quyền thực hiện." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (target?.email === "admin@citedu.vn") {
    return { success: false, message: "Không thể chỉnh sửa tài khoản Super Admin." };
  }

  if (newRoles.length === 0) {
    return { success: false, message: "Phải chọn ít nhất một vai trò." };
  }

  await prisma.$transaction([
    prisma.userSystemRole.deleteMany({ where: { userId } }),
    prisma.userSystemRole.createMany({
      data: newRoles.map((role) => ({ userId, roleId: role, role })),
    }),
  ]);

  revalidatePath("/admin/settings/users");
  return { success: true, message: "Cập nhật vai trò thành công." };
}

export async function updateUserInfoAction(
  userId: string,
  data: { fullName: string; email: string; phone: string; newPassword?: string }
): Promise<UserActionResponse> {
  const session = await getSessionForAction();
  if (!session) return { success: false, message: "Phiên đăng nhập hết hạn." };
  if (!requireRole([SystemRole.ADMIN], session.user.roles)) {
    return { success: false, message: "Không có quyền thực hiện." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (target?.email === "admin@citedu.vn") {
    return { success: false, message: "Không thể chỉnh sửa tài khoản Super Admin." };
  }

  const parsed = updateUserInfoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const { fullName, email, phone, newPassword } = parsed.data;

  try {
    const updateData: Record<string, unknown> = { fullName, email, phone };
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });

    revalidatePath("/admin/settings/users");
    return { success: true, message: "Cập nhật thông tin thành công." };
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return { success: false, message: "Số điện thoại/CCCD đã tồn tại trong hệ thống" };
    }
    return { success: false, message: "Lỗi hệ thống, vui lòng thử lại sau." };
  }
}
