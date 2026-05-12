import { auth } from "@/auth";
import { SystemRole } from "@prisma/client";
import { redirect } from "next/navigation";

export type AuthSession = {
  user: {
    id: string;
    roles: SystemRole[];
    fullName: string;
    email?: string | null;
  };
};

// Dùng trong Page/Layout components — redirect về /login nếu chưa đăng nhập
export async function getRequiredSession(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session as AuthSession;
}

// Dùng trong Server Actions — trả về null thay vì redirect (tránh lỗi khi gọi từ client)
export async function getSessionForAction(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AuthSession;
}

// Kiểm tra role trong Server Action (Rule 3.3: dùng .includes())
export function assertRole(session: AuthSession, roles: SystemRole[]): boolean {
  return session.user.roles.some((r) => roles.includes(r));
}
