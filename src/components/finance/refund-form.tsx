"use client";

import React, { useActionState, useEffect, useState } from "react";
import { createRefundAction } from "@/lib/actions/receipt";
import { 
  User, Banknote, FileText, 
  Loader2, Info, AlertCircle, CreditCard
} from "lucide-react";

interface MemberInfo {
  id: string;
  fullName: string;
  className: string;
  classCode: string;
}

interface RefundFormProps {
  members: MemberInfo[];
}

export function RefundForm({ members }: RefundFormProps) {
  const [state, action, isPending] = useActionState(createRefundAction, null);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    if (state?.success) {
      setSelectedMemberId("");
    }
  }, [state]);

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-6">
      <form action={action} className="space-y-6">
        
        {/* Student Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3 h-3 text-red-500" />
            Học viên nhận hoàn phí
          </label>
          <select
            name="classMemberId"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-2xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-bold transition-all"
          >
            <option value="">-- Chọn học viên --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.fullName} ({m.classCode})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote className="w-3 h-3 text-red-500" />
              Số tiền hoàn
            </label>
            <div className="relative">
              <input
                name="amount"
                type="number"
                placeholder="0"
                className="w-full pl-4 pr-12 py-3 bg-background border border-border rounded-2xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-black transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
            </div>
          </div>

          {/* Refund Method */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-3 h-3 text-red-500" />
              Hình thức hoàn
            </label>
            <select
              name="refundMethod"
              className="w-full px-4 py-3 bg-background border border-border rounded-2xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-bold transition-all"
            >
              <option value="TRANSFER">Chuyển khoản</option>
              <option value="CASH">Tiền mặt</option>
            </select>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3 h-3 text-red-500" />
            Lý do hoàn tiền (Bắt buộc {">"} 20 ký tự)
          </label>
          <textarea
            name="reason"
            rows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-2xl outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-medium resize-none"
            placeholder="Mô tả chi tiết lý do hoàn tiền cho học viên..."
          />
        </div>

        {/* Feedback Message */}
        {state && (
          <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
            state.success 
              ? "bg-green-50 border-green-100 text-green-700" 
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
            {state.success ? <Info className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-xs font-bold leading-relaxed">{state.message}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Tạo phiếu hoàn tiền
            </>
          )}
        </button>
      </form>
    </div>
  );
}
