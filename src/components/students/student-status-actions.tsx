"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  CornerUpLeft, 
  PauseCircle, 
  Loader2, 
  AlertTriangle,
  Calendar
} from "lucide-react";
import { 
  graduateStudentAction, 
  withdrawStudentAction, 
  putOnHoldAction 
} from "@/lib/actions/class";
import { toast } from "sonner"; // Assuming sonner is used, if not I'll use alert

export function StudentStatusActions({ 
  classMemberId, 
  currentStatus 
}: { 
  classMemberId: string, 
  currentStatus: string 
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const handleAction = async (actionType: string) => {
    if (actionType === 'WITHDRAW' && reason.length < 10) {
      alert("Vui lòng nhập lý do rút lui (tối thiểu 10 ký tự).");
      return;
    }
    if (actionType === 'ON_HOLD' && (!reason || !returnDate)) {
      alert("Vui lòng nhập lý do và ngày dự kiến quay lại.");
      return;
    }

    setLoading(actionType);
    try {
      let res;
      if (actionType === 'GRADUATE') {
        res = await graduateStudentAction(classMemberId);
      } else if (actionType === 'WITHDRAW') {
        res = await withdrawStudentAction(classMemberId, reason);
      } else if (actionType === 'ON_HOLD') {
        res = await putOnHoldAction(classMemberId, reason, returnDate);
      }

      if (res?.success) {
        alert(res.message);
        setShowConfirm(null);
        window.location.reload(); // Refresh to show new status
      } else {
        alert(res?.message || "Đã có lỗi xảy ra");
      }
    } catch (error) {
      alert("Lỗi kết nối server.");
    } finally {
      setLoading(null);
    }
  };

  const Button = ({ icon: Icon, label, color, onClick, disabled, activeAction }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || loading !== null}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        disabled ? "opacity-30 grayscale cursor-not-allowed" : color
      }`}
    >
      {loading === activeAction ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );

  return (
    <div className="pt-4 border-t border-border space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          icon={CheckCircle2} 
          label="Tốt nghiệp" 
          color="bg-green-50 text-green-700 hover:bg-green-100" 
          onClick={() => setShowConfirm('GRADUATE')}
          disabled={currentStatus === 'graduated'}
          activeAction="GRADUATE"
        />
        <Button 
          icon={CornerUpLeft} 
          label="Rút lui" 
          color="bg-red-50 text-red-700 hover:bg-red-100" 
          onClick={() => setShowConfirm('WITHDRAW')}
          disabled={currentStatus === 'WITHDRAWN'}
          activeAction="WITHDRAW"
        />
        <Button 
          icon={PauseCircle} 
          label="Bảo lưu" 
          color="bg-amber-50 text-amber-700 hover:bg-amber-100" 
          onClick={() => setShowConfirm('ON_HOLD')}
          disabled={currentStatus === 'ON_HOLD'}
          activeAction="ON_HOLD"
        />
      </div>

      {/* Confirmation Modals (Simple Inline for Mobile-first) */}
      {showConfirm === 'GRADUATE' && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-green-600 mt-0.5" />
            <p className="text-xs font-bold text-green-800 leading-relaxed">
              Bạn có chắc chắn học viên đã đủ điều kiện (Chuyên cần {'>'}=80% và Học phí {'>'}=50%) để tốt nghiệp?
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction('GRADUATE')}
              className="flex-1 py-2 bg-green-600 text-white text-[10px] font-black rounded-lg uppercase"
            >
              Xác nhận tốt nghiệp
            </button>
            <button 
              onClick={() => setShowConfirm(null)}
              className="px-4 py-2 bg-card text-slate-400 text-[10px] font-black rounded-lg uppercase"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showConfirm === 'WITHDRAW' && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-bold text-red-800 uppercase tracking-widest">Cho học viên rút lui</p>
          <textarea
            placeholder="Nhập lý do rút lui (Tối thiểu 10 ký tự)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 text-xs bg-card border border-red-100 rounded-xl outline-none focus:ring-2 focus:ring-red-200"
            rows={3}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction('WITHDRAW')}
              className="flex-1 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg uppercase"
            >
              Xác nhận rút lui
            </button>
            <button 
              onClick={() => setShowConfirm(null)}
              className="px-4 py-2 bg-card text-slate-400 text-[10px] font-black rounded-lg uppercase"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showConfirm === 'ON_HOLD' && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Tạm dừng bảo lưu</p>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Lý do bảo lưu</label>
            <input
              placeholder="Nhập lý do..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 text-xs bg-card border border-amber-100 rounded-xl outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest block">Ngày dự kiến quay lại</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full p-3 text-xs bg-card border border-amber-100 rounded-xl outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction('ON_HOLD')}
              className="flex-1 py-2 bg-amber-600 text-white text-[10px] font-black rounded-lg uppercase"
            >
              Xác nhận bảo lưu
            </button>
            <button 
              onClick={() => setShowConfirm(null)}
              className="px-4 py-2 bg-card text-slate-400 text-[10px] font-black rounded-lg uppercase"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
