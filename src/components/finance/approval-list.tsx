"use client";

import React, { useActionState, useState, useTransition } from "react";
import { approveReceiptsAction, cancelReceiptAction } from "@/lib/actions/receipt";
import {
  CheckCircle2, Clock, Wallet, User,
  Loader2, Info, AlertCircle,
  Banknote, RefreshCcw, CheckSquare, Square,
  Ban, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Receipt {
  id: string;
  receiptCode: string;
  amount: number;
  paymentMethod: string;
  senderName: string | null;
  senderBankAccount: string | null;
  paymentDate: Date;
  status: string;
  classMember: {
    class: { name: string; classCode: string };
    student: { fullName: string };
  };
}

interface ApprovalListProps {
  receipts: Receipt[];
}

export function ApprovalList({ receipts: initialReceipts }: ApprovalListProps) {
  const [filter, setFilter] = useState<string>("PENDING_APPROVAL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, action, isPending] = useActionState(approveReceiptsAction, null);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (cancelReason.trim().length < 20) {
      setCancelError("Lý do hủy phải có ít nhất 20 ký tự.");
      return;
    }
    setCancelError(null);
    startCancelTransition(async () => {
      const result = await cancelReceiptAction(id, cancelReason);
      if (result.success) {
        setCancellingId(null);
        setCancelReason("");
      } else {
        setCancelError(result.message);
      }
    });
  };

  const filteredReceipts = initialReceipts.filter(r =>
    filter === "ALL" ? true : r.status === filter
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.length === filteredReceipts.length ? [] : filteredReceipts.map(r => r.id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-600 border-amber-200">Chờ duyệt</Badge>;
      case "CONFIRMED":
        return <Badge variant="outline" className="text-[9px] bg-green-50 text-green-600 border-green-200">Đã duyệt</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "PENDING_APPROVAL", label: "Chờ duyệt" },
            { id: "CONFIRMED", label: "Đã duyệt" },
            { id: "ALL", label: "Tất cả" },
          ].map((t) => (
            <Button
              key={t.id}
              variant={filter === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(t.id); setSelectedIds([]); }}
              className="whitespace-nowrap text-[11px] font-black uppercase tracking-widest rounded-2xl"
            >
              {t.label}
            </Button>
          ))}
        </div>

        {filter === "PENDING_APPROVAL" && filteredReceipts.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-[10px] font-black text-primary uppercase tracking-widest gap-2 h-auto py-1"
            >
              {selectedIds.length === filteredReceipts.length
                ? <CheckSquare className="w-4 h-4" />
                : <Square className="w-4 h-4" />}
              {selectedIds.length === filteredReceipts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
            <p className="text-[10px] font-bold text-muted-foreground italic">
              Đang chọn {selectedIds.length} phiếu
            </p>
          </div>
        )}
      </div>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border p-12 rounded-3xl text-center space-y-3">
          <Wallet className="w-12 h-12 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground text-sm italic">Không có phiếu thu nào.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-32">
          {filteredReceipts.map((r) => (
            <div
              key={r.id}
              onClick={() => filter === "PENDING_APPROVAL" && toggleSelect(r.id)}
              className={`
                bg-card p-5 rounded-3xl border transition-all relative overflow-hidden group
                ${selectedIds.includes(r.id) ? "border-primary ring-2 ring-primary/10 shadow-lg shadow-primary/10" : "border-border shadow-sm hover:border-muted-foreground/20"}
                ${filter === "PENDING_APPROVAL" ? "cursor-pointer" : ""}
              `}
            >
              {filter === "PENDING_APPROVAL" && (
                <div className="absolute top-4 right-4 z-10">
                  {selectedIds.includes(r.id) ? (
                    <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                      <CheckSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-muted border-2 border-border rounded-lg group-hover:border-primary/40 transition-colors" />
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start pr-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{r.receiptCode || "CHƯA CÓ MÃ"}</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground/40" />
                      <h3 className="text-sm font-black text-foreground">{r.classMember.student.fullName}</h3>
                    </div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                      {r.classMember.class.classCode} - {r.classMember.class.name}
                    </p>
                  </div>
                  {getStatusBadge(r.status)}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Số tiền thu</p>
                    <p className="text-sm font-black text-foreground">{r.amount.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Hình thức</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      {r.paymentMethod === "CASH"
                        ? <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                        : <RefreshCcw className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="text-[10px] font-bold text-foreground">
                        {r.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}
                      </span>
                    </div>
                  </div>
                </div>

                {r.paymentMethod === "TRANSFER" && (
                  <div className="p-3 border border-border rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Người chuyển</p>
                      <p className="text-[10px] font-black text-foreground uppercase">{r.senderName || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Số TK / Ngân hàng</p>
                      <p className="text-[10px] font-bold text-foreground">{r.senderBankAccount || "N/A"}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-muted-foreground italic">
                  <Clock className="w-3.5 h-3.5" />
                  Thu ngày {r.paymentDate && !isNaN(new Date(r.paymentDate).getTime())
                    ? format(new Date(r.paymentDate), "dd/MM/yyyy", { locale: vi })
                    : "—"}
                </div>

                {/* Cancel for Confirmed */}
                {r.status === "CONFIRMED" && (
                  <div className="pt-4 border-t border-border/50">
                    {cancellingId === r.id ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-destructive uppercase tracking-widest flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            Nhập lý do hủy phiếu (Bắt buộc &gt; 20 ký tự)
                          </label>
                          <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Nhập lý do chi tiết..."
                            className="w-full px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-2xl text-xs outline-none focus:border-destructive/40 transition-all resize-none"
                            rows={2}
                          />
                          {cancelError && <p className="text-[9px] font-bold text-destructive">{cancelError}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(r.id)}
                            disabled={isCancelling}
                            className="flex-1 text-[10px] font-black uppercase tracking-widest rounded-xl"
                          >
                            {isCancelling ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                            Xác nhận hủy
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setCancellingId(null); setCancelReason(""); setCancelError(null); }}
                            disabled={isCancelling}
                            className="text-[10px] font-black uppercase tracking-widest rounded-xl"
                          >
                            Đóng
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setCancellingId(r.id); }}
                        className="text-[10px] font-black text-muted-foreground hover:text-destructive uppercase tracking-widest h-auto py-1 gap-1.5"
                      >
                        <Ban className="w-3 h-3" />
                        Hủy phiếu thu
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Action Button */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-4 z-20 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <form action={action}>
              <input type="hidden" name="receiptIds" value={selectedIds.join(",")} />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full py-6 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                )}
                Duyệt hàng loạt ({selectedIds.length}) phiếu thu
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Action Feedback */}
      {state && (
        <div className="fixed bottom-28 left-0 right-0 px-4 z-20 pointer-events-none">
          <div className={`max-w-xl mx-auto p-4 rounded-2xl flex items-center gap-3 border shadow-lg pointer-events-auto ${
            state.success
              ? "bg-accent/10 border-accent/20 text-accent"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}>
            {state.success ? <Info className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-bold">{state.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
