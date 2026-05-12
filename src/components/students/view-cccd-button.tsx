"use client";

import React, { useState, useEffect } from "react";
import { viewCCCDAction } from "@/lib/actions/student";
import { Eye, EyeOff, ShieldAlert, Loader2, Timer, Lock } from "lucide-react";

interface ViewCccdButtonProps {
  studentId: string;
}

export function ViewCccdButton({ studentId }: ViewCccdButtonProps) {
  const [cccd, setCccd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await viewCCCDAction(studentId);
      
      if (result.success && result.cccd) {
        setCccd(result.cccd);
        setTimeLeft(30); // Start 30s countdown
      }
    } catch (err: any) {
      setError(err.message || "Không thể xem CCCD");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Countdown and Auto-hide logic
  useEffect(() => {
    if (timeLeft <= 0) {
      if (cccd) setCccd(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, cccd]);

  if (cccd) {
    return (
      <div className="space-y-3">
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center justify-between animate-pulse shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Dữ liệu nhạy cảm - Đang hiển thị</p>
            <p className="text-2xl font-mono font-bold text-red-600 tracking-[0.2em]">
              {cccd}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 bg-red-100 px-3 py-2 rounded-lg border border-red-200">
            <Timer className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-600">{timeLeft}s</span>
          </div>
        </div>
        <button
          onClick={() => setCccd(null)}
          className="w-full py-2 text-xs font-bold text-slate-400 hover:text-muted-foreground flex items-center justify-center gap-2 transition-colors"
        >
          <EyeOff className="w-3 h-3" />
          Ẩn ngay lập tức
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
          <ShieldAlert className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
      
      <button
        onClick={handleView}
        disabled={loading}
        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <>
            <Eye className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            Xem số CCCD
          </>
        )}
      </button>
      
      <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
        <Lock className="w-3 h-3 text-slate-300" />
        Truy cập này sẽ được ghi nhật ký hệ thống (Audit Log)
      </p>
    </div>
  );
}
