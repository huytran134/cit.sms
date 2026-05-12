"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LayoutDashboard, Presentation, GraduationCap,
  ShieldCheck, Banknote, Upload, Users,
  LogOut, ChevronRight, Settings,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/classes", label: "Lớp học", icon: Presentation },
  { href: "/admin/programs", label: "Chương trình", icon: GraduationCap },
  { href: "/admin/finance/approvals", label: "Duyệt phiếu thu", icon: ShieldCheck },
  { href: "/admin/finance/refunds", label: "Hoàn tiền", icon: Banknote },
  { href: "/admin/settings/data-import", label: "Nhập dữ liệu", icon: Upload },
  { href: "/admin/settings/users", label: "Quản lý nhân sự", icon: Settings },
];

const STAFF_NAV: NavItem[] = [
  { href: "/staff/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/staff/leads", label: "Khách tiềm năng", icon: Users },
  { href: "/staff/students", label: "Học viên", icon: GraduationCap },
  { href: "/staff/classes", label: "Lớp học", icon: Presentation },
];

interface SidebarProps {
  role: "admin" | "staff";
  userName: string;
  className?: string;
  onNavClick?: () => void;
}

function NavLink({ item, onNavClick }: { item: NavItem; onNavClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn(
        "w-4 h-4 shrink-0",
        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
      )} />
      <span className="flex-1 truncate">{item.label}</span>
      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
    </Link>
  );
}

export function AppSidebar({ role, userName, className, onNavClick }: SidebarProps) {
  const navItems = role === "admin" ? ADMIN_NAV : STAFF_NAV;
  const roleLabel = role === "admin" ? "Quản trị viên" : "Nhân viên";

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground tracking-tight">CiT-SMS</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              CiT EDU JSC
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onNavClick={onNavClick} />
        ))}
      </nav>

      <Separator />

      {/* Bottom: Theme + User + Logout */}
      <div className="px-3 py-4 space-y-1">
        {/* Theme Toggle */}
        <ThemeToggle />

        <Separator className="my-2" />

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-black text-primary uppercase">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{userName}</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}
