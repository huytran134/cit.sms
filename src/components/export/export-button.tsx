"use client";

import React, { useState, useTransition } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { ExportActionResponse } from "@/lib/actions/export";

interface ExportButtonProps {
  label: string;
  action: () => Promise<ExportActionResponse>;
  variant?: "blue" | "red" | "green";
}

const variantClasses: Record<string, string> = {
  blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
  red: "bg-red-700 hover:bg-red-800 shadow-red-700/20",
  green: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
};

export function ExportButton({ label, action, variant = "blue" }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success || !result.data || !result.filename) {
        setError(result.message ?? "Đã có lỗi xảy ra khi xuất file.");
        return;
      }
      // Chuyển base64 → Blob → download
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-[0.97] disabled:opacity-70 uppercase tracking-widest ${variantClasses[variant]}`}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        {isPending ? "Đang xuất..." : label}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
