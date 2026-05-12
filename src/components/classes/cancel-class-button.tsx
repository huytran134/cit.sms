"use client";

import React, { useState, useTransition } from "react";
import { cancelClassAction } from "@/lib/actions/class";
import { Ban, Loader2, AlertTriangle, X } from "lucide-react";

interface CancelClassButtonProps {
  classId: string;
  isAdmin: boolean;
  currentStatus: string;
}

export function CancelClassButton({ classId, isAdmin, currentStatus }: CancelClassButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Chỉ Admin mới thấy nút này
  if (!isAdmin) return null;
  // Không hiện nút nếu lớp đã hủy hoặc đã hoàn thành
  if (currentStatus === "CANCELLED" || currentStatus === "COMPLETED") return null;

  const handleCancel = () => {
    if (reason.trim().length < 20) {
      setError("Lý do hủy lớp phải có ít nhất 20 ký tự.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await cancelClassAction(classId, reason);
      if (result.success) {
        alert(result.message);
        window.location.reload();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="mt-4">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs rounded-2xl border-2 border-dashed border-red-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <Ban className="w-4 h-4" />
          Hủy lớp học
        </button>
      ) : (
        <div className="p-5 bg-red-50 border-2 border-red-200 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-black text-red-900 uppercase tracking-wider">Xác nhận Hủy lớp</p>
                <p className="text-[11px] text-red-600 font-medium mt-1 leading-relaxed">
                  Hành động này không thể hoàn tác. Trạng thái lớp sẽ chuyển sang <strong>CANCELLED</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowConfirm(false); setReason(""); setError(null); }}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-red-700 uppercase tracking-widest">
              Lý do hủy lớp <span className="text-red-500">*</span> (Tối thiểu 20 ký tự)
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(null); }}
              placeholder="Ví dụ: Không đủ học viên theo yêu cầu tối thiểu, lớp bị hủy theo quyết định của Ban giám đốc..."
              rows={3}
              className="w-full px-4 py-3 bg-card border border-red-200 rounded-2xl text-xs font-medium outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none"
            />
            <div className="flex justify-between items-center">
              {error ? (
                <p className="text-[10px] font-bold text-red-600">{error}</p>
              ) : (
                <span />
              )}
              <p className="text-[10px] text-red-400 font-mono ml-auto">{reason.trim().length}/20</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  Xác nhận hủy lớp
                </>
              )}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setReason(""); setError(null); }}
              disabled={isPending}
              className="px-5 py-3 bg-card text-muted-foreground font-black text-xs rounded-2xl border border-border hover:bg-background transition-all uppercase tracking-widest"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
