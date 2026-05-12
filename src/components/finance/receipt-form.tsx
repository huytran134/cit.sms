"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReceiptSchema, CreateReceiptInput } from "@/lib/validation/receipt.schema";
import { createReceiptAction } from "@/lib/actions/receipt";
import { 
  Wallet, User, CreditCard, Banknote, 
  FileText, Calendar, Info, Loader2, AlertCircle
} from "lucide-react";

interface MemberDebtInfo {
  id: string; // classMemberId
  fullName: string;
  tuitionFeeActual: number;
  remainingDebt: number;
}

interface ReceiptFormProps {
  members: MemberDebtInfo[];
}

export function ReceiptForm({ members }: ReceiptFormProps) {
  const [state, action, isPending] = useActionState(createReceiptAction, null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const {
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateReceiptInput>({
    resolver: zodResolver(createReceiptSchema) as any,
    defaultValues: {
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
    },
  });

  // When member changes, update amount to remaining debt
  useEffect(() => {
    if (selectedMember) {
      setValue("amount", selectedMember.remainingDebt);
    }
  }, [selectedMember, setValue]);

  useEffect(() => {
    if (state?.success) {
      reset();
      setSelectedMemberId("");
      setPaymentMethod("CASH");
    }
  }, [state, reset]);

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-6">
      <form action={action} className="space-y-6">
        
        {/* Student Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3 h-3 text-blue-500" />
            Chọn học viên nộp phí
          </label>
          <select
            {...register("classMemberId")}
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className={`w-full px-4 py-3 bg-background border rounded-2xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-sm font-bold ${
              errors.classMemberId ? "border-red-500" : "border-border focus:border-blue-500"
            }`}
          >
            <option value="">-- Chọn học viên --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.fullName}</option>
            ))}
          </select>
          {errors.classMemberId && <p className="text-red-500 text-xs font-medium">{errors.classMemberId.message}</p>}

          {/* Smart Debt Info */}
          {selectedMember && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100 mt-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  Học phí thực: <span className="text-foreground">{selectedMember.tuitionFeeActual.toLocaleString('vi-VN')}đ</span>
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  Đang nợ: <span className="text-red-600">{selectedMember.remainingDebt.toLocaleString('vi-VN')}đ</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Amount */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote className="w-3 h-3 text-blue-500" />
              Số tiền thu thực tế
            </label>
            <div className="relative">
              <input
                {...register("amount")}
                type="number"
                placeholder="0"
                className={`w-full pl-4 pr-12 py-3 bg-background border rounded-2xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-sm font-black ${
                  errors.amount ? "border-red-500 bg-red-50" : "border-border focus:border-blue-500"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
            </div>
            {errors.amount && <p className="text-red-500 text-xs font-medium">{errors.amount.message}</p>}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-500" />
              Ngày thu tiền
            </label>
            <input
              {...register("paymentDate")}
              type="date"
              className="w-full px-4 py-3 bg-background border border-border rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-bold"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="w-3 h-3 text-blue-500" />
            Hình thức thanh toán
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["CASH", "TRANSFER"].map((method) => (
              <label 
                key={method}
                className={`
                  flex items-center justify-center gap-2 py-3 rounded-2xl border-2 cursor-pointer transition-all
                  ${paymentMethod === method 
                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm shadow-blue-200/50" 
                    : "border-slate-50 bg-background text-slate-400 grayscale"}
                `}
              >
                <input 
                  type="radio" 
                  {...register("paymentMethod")} 
                  value={method}
                  className="sr-only"
                  onChange={() => setPaymentMethod(method as "CASH" | "TRANSFER")}
                />
                {method === "CASH" ? <Banknote className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                <span className="text-xs font-black uppercase tracking-widest">{method === "CASH" ? "Tiền mặt" : "Chuyển khoản"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Conditional Transfer Fields */}
        {paymentMethod === "TRANSFER" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-background rounded-3xl border border-border animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Tên người chuyển khoản <span className="text-red-500">*</span>
              </label>
              <input
                {...register("senderName")}
                placeholder="Ví dụ: NGUYEN VAN A"
                className={`w-full px-4 py-2.5 bg-card border rounded-xl text-sm font-bold outline-none ${
                  errors.senderName ? "border-red-500 focus:ring-red-500/20" : "border-border focus:border-blue-500"
                }`}
              />
              {errors.senderName && <p className="text-red-500 text-[10px] font-bold">{errors.senderName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Số TK / Ngân hàng <span className="text-red-500">*</span>
              </label>
              <input
                {...register("senderBankAccount")}
                placeholder="Ví dụ: 123456789 - VCB"
                className={`w-full px-4 py-2.5 bg-card border rounded-xl text-sm font-bold outline-none ${
                  errors.senderBankAccount ? "border-red-500 focus:ring-red-500/20" : "border-border focus:border-blue-500"
                }`}
              />
              {errors.senderBankAccount && <p className="text-red-500 text-[10px] font-bold">{errors.senderBankAccount.message}</p>}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3 h-3 text-blue-500" />
            Ghi chú phiếu thu
          </label>
          <textarea
            {...register("senderNote")}
            rows={2}
            className="w-full px-4 py-3 bg-background border border-border rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-medium resize-none"
            placeholder="Nội dung bổ sung nếu có..."
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
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Nhập phiếu thu (Chờ Admin duyệt)
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Simple internal icon
function RefreshCcw(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
  )
}
