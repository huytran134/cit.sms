import { AppShell } from "@/components/layout/app-shell";
import { getRequiredSession } from "@/lib/auth/session";
import ChatWidget from "@/components/ai/chat-widget";

export const metadata = {
  title: "CiT-SMS Staff",
  description: "Hệ thống quản lý học viên CiT EDU JSC",
};

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();
  return (
    <AppShell role="staff" userName={session.user.fullName}>
      {children}
      <ChatWidget />
    </AppShell>
  );
}
