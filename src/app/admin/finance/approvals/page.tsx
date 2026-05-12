import React from "react";
import { prisma } from "@/lib/db";
import { ApprovalList } from "@/components/finance/approval-list";
import { ExportButton } from "@/components/export/export-button";
import { exportDebtReport } from "@/lib/actions/export";
import {
  ShieldCheck, LayoutGrid, ArrowLeft,
  Banknote, History
} from "lucide-react";
import { serializeDecimal } from "@/lib/utils/serialize";
import Link from "next/link";

export default async function ApprovalsPage() {
  async function handleExportDebtReport() {
    "use server";
    return exportDebtReport();
  }

  // Fetch all receipts with necessary relations
  // Ordered by created date descending
  const receipts = await prisma.paymentReceipt.findMany({
    include: {
      classMember: {
        include: {
          class: {
            select: {
              name: true,
              classCode: true,
            },
          },
          student: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingCount = receipts.filter(r => r.status === "PENDING_APPROVAL").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedReceipts = serializeDecimal(receipts) as any;

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link 
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Quản lý lớp học
        </Link>

        {/* Header Section */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Hệ thống đối soát</span>
              </div>
              <h1 className="text-2xl font-black text-foreground leading-tight">
                Duyệt phiếu thu
              </h1>
              <p className="text-xs text-muted-foreground font-bold">Xác nhận doanh thu & Cập nhật công nợ</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black uppercase tracking-tighter">Đang chờ</p>
                <p className="text-xl font-black">{pendingCount}</p>
              </div>
              <ExportButton
                label="Xuất công nợ"
                action={handleExportDebtReport}
                variant="red"
              />
            </div>
          </div>
        </div>

        {/* Approval List with Tabs */}
        <ApprovalList receipts={serializedReceipts} />

      </div>
    </main>
  );
}
