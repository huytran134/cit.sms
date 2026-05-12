"use client";

import { useState, useTransition } from "react";
import { SystemRole } from "@prisma/client";
import {
  toggleStaffActiveAction,
  updateUserRolesAction,
  updateUserInfoAction,
} from "@/lib/actions/user";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Shield, Pencil, UserCog, Loader2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

const SUPER_ADMIN_EMAIL = "admin@citedu.vn";

const ROLE_OPTIONS: { value: SystemRole; label: string }[] = [
  { value: SystemRole.ADMIN, label: "Quản trị viên" },
  { value: SystemRole.CLASS_LEADER, label: "Chủ nhiệm lớp" },
  { value: SystemRole.TEACHER, label: "Giảng viên" },
];

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  CLASS_LEADER:
    "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  TEACHER:
    "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
};

type StaffUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  systemRoles: { role: SystemRole }[];
};

type FeedbackState = { type: "success" | "error"; message: string } | null;

export function UserManagementTable({ users }: { users: StaffUser[] }) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  // --- Edit Roles dialog state ---
  const [rolesTarget, setRolesTarget] = useState<StaffUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<SystemRole[]>([]);

  // --- Edit Info dialog state ---
  const [infoTarget, setInfoTarget] = useState<StaffUser | null>(null);
  const [infoForm, setInfoForm] = useState({ fullName: "", email: "", phone: "", newPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  }

  // --- Roles dialog handlers ---
  function openRolesDialog(user: StaffUser) {
    setRolesTarget(user);
    setSelectedRoles(user.systemRoles.map((r) => r.role));
  }

  function toggleRole(role: SystemRole) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleSaveRoles() {
    if (!rolesTarget) return;
    startTransition(async () => {
      const res = await updateUserRolesAction(rolesTarget.id, selectedRoles);
      showFeedback(res.success ? "success" : "error", res.message);
      if (res.success) setRolesTarget(null);
    });
  }

  // --- Info dialog handlers ---
  function openInfoDialog(user: StaffUser) {
    setInfoTarget(user);
    setInfoForm({ fullName: user.fullName, email: user.email, phone: user.phone, newPassword: "" });
    setShowNewPassword(false);
  }

  function handleSaveInfo() {
    if (!infoTarget) return;
    startTransition(async () => {
      const res = await updateUserInfoAction(infoTarget.id, {
        fullName: infoForm.fullName,
        email: infoForm.email,
        phone: infoForm.phone,
        newPassword: infoForm.newPassword || undefined,
      });
      showFeedback(res.success ? "success" : "error", res.message);
      if (res.success) setInfoTarget(null);
    });
  }

  // --- Toggle active ---
  function handleToggleActive(user: StaffUser, checked: boolean) {
    startTransition(async () => {
      const res = await toggleStaffActiveAction(user.id, checked);
      showFeedback(res.success ? "success" : "error", res.message);
    });
  }

  return (
    <>
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg transition-all ${
            feedback.type === "success"
              ? "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Edit Roles Dialog */}
      <Dialog open={!!rolesTarget} onOpenChange={(open) => !open && setRolesTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sửa vai trò — {rolesTarget?.fullName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(opt.value)}
                  onChange={() => toggleRole(opt.value)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>

          {selectedRoles.length === 0 && (
            <p className="text-xs text-destructive">Phải chọn ít nhất một vai trò.</p>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Hủy</Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={handleSaveRoles}
              disabled={isPending || selectedRoles.length === 0}
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Info Dialog */}
      <Dialog open={!!infoTarget} onOpenChange={(open) => !open && setInfoTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa thông tin — {infoTarget?.fullName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fullName">Họ và tên <span className="text-destructive">*</span></Label>
              <Input
                id="edit-fullName"
                value={infoForm.fullName}
                onChange={(e) => setInfoForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="edit-email"
                type="email"
                value={infoForm.email}
                onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="nhanvien@citedu.vn"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Số điện thoại <span className="text-destructive">*</span></Label>
              <Input
                id="edit-phone"
                value={infoForm.phone}
                onChange={(e) => setInfoForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0912345678"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-password">
                Mật khẩu mới
                <span className="text-muted-foreground font-normal ml-1 text-xs">(để trống nếu không đổi)</span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showNewPassword ? "text" : "password"}
                  value={infoForm.newPassword}
                  onChange={(e) => setInfoForm((f) => ({ ...f, newPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Hủy</Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={handleSaveInfo}
              disabled={isPending || !infoForm.fullName || !infoForm.email || !infoForm.phone}
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User list */}
      {users.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border p-12 rounded-2xl text-center">
          <p className="text-muted-foreground text-sm italic">Chưa có tài khoản nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
            return (
              <Card
                key={user.id}
                className={`border-border transition-all ${!user.isActive ? "opacity-60" : ""} ${isSuperAdmin ? "ring-1 ring-primary/30" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{user.fullName}</span>
                        {isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                            <Shield className="w-2.5 h-2.5" />
                            Super Admin
                          </span>
                        )}
                        {!user.isActive && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-destructive/10 text-destructive border-destructive/20"
                          >
                            Vô hiệu hóa
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>

                      {/* Roles */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {user.systemRoles.map(({ role }) => (
                          <span
                            key={role}
                            className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                              ROLE_COLOR[role] ?? "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                      <p className="text-[10px] text-muted-foreground italic">
                        Tạo ngày {format(new Date(user.createdAt), "dd/MM/yyyy")}
                      </p>

                      {isSuperAdmin ? (
                        <span className="text-[10px] text-muted-foreground italic px-2 py-1 rounded bg-muted border border-border">
                          Tài khoản được bảo vệ
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Edit Info */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => openInfoDialog(user)}
                            disabled={isPending}
                          >
                            <UserCog className="w-3 h-3" />
                            Sửa thông tin
                          </Button>

                          {/* Edit Roles */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => openRolesDialog(user)}
                            disabled={isPending}
                          >
                            <Pencil className="w-3 h-3" />
                            Sửa vai trò
                          </Button>

                          {/* Toggle Active */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {user.isActive ? "Hoạt động" : "Đã khóa"}
                            </span>
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={(checked) => handleToggleActive(user, checked)}
                              disabled={isPending}
                              aria-label={`Trạng thái tài khoản ${user.fullName}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
