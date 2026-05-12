"use client";

import { useActionState } from "react";
import { createStaffAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "CLASS_LEADER", label: "Chủ nhiệm lớp (CNL)" },
  { value: "TEACHER", label: "Giảng viên" },
];

export function CreateStaffForm() {
  const [state, action, isPending] = useActionState(createStaffAction, null);
  const [showPassword, setShowPassword] = useState(false);

  const selectClass =
    "w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-ring/20 focus:border-ring";

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          Tạo tài khoản nhân sự mới
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Họ tên */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên <span className="text-destructive">*</span></Label>
              <Input id="fullName" name="fullName" placeholder="Nguyễn Văn A" required />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input id="email" name="email" type="email" placeholder="nhanvien@citedu.vn" required />
            </div>

            {/* Điện thoại */}
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại <span className="text-destructive">*</span></Label>
              <Input id="phone" name="phone" placeholder="0912345678" required />
            </div>

            {/* Chức vụ */}
            <div className="space-y-2">
              <Label htmlFor="role">Chức vụ <span className="text-destructive">*</span></Label>
              <select id="role" name="role" className={selectClass} required defaultValue="">
                <option value="" disabled>--- Chọn chức vụ ---</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">
                Mật khẩu <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal ml-1">(tối thiểu 8 ký tự, 1 chữ hoa, 1 số)</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {state && (
            <div className={`p-3 rounded-lg text-sm font-medium border ${
              state.success
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}>
              {state.message}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full md:w-auto">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
