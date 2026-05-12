import { AppShell } from "@/components/layout/app-shell";
import { getRequiredSession } from "@/lib/auth/session";
import ChatWidget from "@/components/ai/chat-widget";

export const metadata = {
  title: "CiT-SMS Admin",
  description: "Hệ thống quản lý học viên CiT EDU JSC",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();
  return (
    <AppShell role="admin" userName={session.user.fullName}>
      {children}
      <ChatWidget />
    </AppShell>
  );
}
