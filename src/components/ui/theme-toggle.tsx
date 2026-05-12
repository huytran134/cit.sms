"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Tránh hydration mismatch — chỉ render sau khi mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded bg-muted animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Chế độ tối</span>
        </div>
        <div className="w-9 h-5 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors">
      <Label
        htmlFor="theme-switch"
        className="flex items-center gap-2.5 cursor-pointer select-none"
      >
        {isDark
          ? <Moon className="w-4 h-4 text-primary" />
          : <Sun className="w-4 h-4 text-amber-500" />}
        <span className="text-xs font-medium text-foreground">
          {isDark ? "Chế độ tối" : "Chế độ sáng"}
        </span>
      </Label>
      <Switch
        id="theme-switch"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Chuyển đổi giao diện sáng/tối"
      />
    </div>
  );
}
