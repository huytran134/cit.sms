"use client";

import React from "react";

export function StudentExceptionActions({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;

  return (
    <div className="mt-6 border-2 border-dashed border-red-200 rounded-2xl p-6 bg-red-50 space-y-4">
      <h3 className="text-sm font-black text-red-800 uppercase tracking-wider">Xử lý Ngoại lệ Học viên</h3>
      <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest italic">Cảnh báo: Thao tác này không thể hoàn tác ngược. Hệ thống sẽ ghi nhận mọi hành động của bạn (Audit Log).</p>
      
      <button 
        onClick={() => {
          confirm("Bạn có chắc chắn muốn cho học viên này RÚT QUA KHÔNG hoàn tiền? Lịch sử không thể xóa.");
        }}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
      >
        ⚠️ Cho Rút lui (Xóa hoàn toàn khỏi hệ thống)
      </button>

      <button 
        onClick={() => {
          confirm("Bạn chắc chắn HV xin RÚT LỢI MỘT PHẦI KHÔNG? Hệ thống sẽ tự động tạo phiếu hoàn tiền (Refund Receipt).");
        }}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        💸 Tạo Phiếu Hoàn tiền một phần học phí
      </button>
    </div>
  );
}
