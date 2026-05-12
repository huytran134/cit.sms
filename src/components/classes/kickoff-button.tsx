"use client";

import React, { useTransition } from "react";
import { kickoffClassAction } from "@/lib/actions/class";
import { PlayCircle, Loader2, AlertTriangle } from "lucide-react";

interface KickoffButtonProps {
  classId: string;
}

export function KickoffButton({ classId }: KickoffButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleKickoff = () => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn khai giảng lớp này?\n\nHệ thống sẽ chuyển trạng thái toàn bộ học viên sang ĐANG HỌC và bắt đầu quá trình đào tạo."
    );

    if (confirmed) {
      startTransition(async () => {
        const result = await kickoffClassAction(classId);
        if (result.success) {
          alert(result.message);
          window.location.reload();
        } else {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className="p-6 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">Khai giảng lớp học</h3>
          <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
            Hành động này sẽ thay đổi trạng thái của Lớp, Học viên và Hồ sơ nhập học. Vui lòng đảm bảo danh sách nhân sự và học viên đã chính xác.
          </p>
        </div>
      </div>

      <button
        onClick={handleKickoff}
        disabled={isPending}
        className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group"
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <PlayCircle className="w-5 h-5 text-amber-100 group-hover:scale-110 transition-transform" />
            Xác nhận Khai giảng ngay
          </>
        )}
      </button>
    </div>
  );
}
