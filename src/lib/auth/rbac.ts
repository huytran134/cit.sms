import { SystemRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Pure helper function to check if a user has at least one of the allowed roles.
 * This function follows rule 3.3 in CLAUDE.md: using .includes() for array-based roles.
 */
export const checkAccess = (allowedRoles: SystemRole[], userRoles: SystemRole[]): boolean => {
  if (allowedRoles.length === 0) return true;
  return userRoles.some((role) => allowedRoles.includes(role));
};

/**
 * Usage in Server Actions:
 * const hasAccess = requireRole(["ADMIN"], user.roles);
 */
export const requireRole = (allowedRoles: SystemRole[], userRoles: SystemRole[]): boolean => {
  return checkAccess(allowedRoles, userRoles);
};

/**
 * Trả về base path dựa trên role. Admin → /admin, còn lại → /staff.
 * Dùng trong Server Components để render link động.
 */
export async function getBasePath(): Promise<"/admin" | "/staff"> {
  const session = await auth();
  const roles = (session?.user as any)?.roles as string[] ?? [];
  return roles.includes("ADMIN") ? "/admin" : "/staff";
}

/**
 * Server Action helper: redirect về trang chi tiết lớp đúng theo role.
 * Admin → /admin/classes/[classId], CNL/Teacher → /staff/classes/[classId].
 */
export async function redirectToClassDetail(classId: string): Promise<never> {
  const base = await getBasePath();
  redirect(`${base}/classes/${classId}`);
}
