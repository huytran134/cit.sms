import React from "react";
import { prisma } from "@/lib/db";
import { ReceiptForm } from "@/components/finance/receipt-form";
import {
  ArrowLeft, Wallet, History, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface AdminClassFinancePageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function AdminClassFinancePage({ params }: AdminClassFinancePageProps) {
  const { classId } = await params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      members: {
        include: {
          student: {
            select: {
              fullName: true,
            },
          },
          paymentReceipts: {
            where: {
              status: "CONFIRMED",
            },
            select: {
              amount: true,
            },
          },
        },
      },
    },
  });

  if (!cls) {
    notFound();
  }

  const membersWithDebt = cls.members.map((member) => {
    const paidAmount = member.paymentReceipts.reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const remainingDebt = Math.max(0, member.tuitionFeeActual.toNumber() - paidAmount);

    return {
      id: member.id,
      fullName: member.student.fullName,
      tuitionFeeActual: member.tuitionFeeActual.toNumber(),
      remainingDebt,
    };
  });

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Navigation */}
        <Link
          href={`/admin/classes/${classId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Chi tiết lớp học
        </Link>

        {/* Header Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">
              {cls.classCode}
            </span>
            <Wallet className="w-4 h-4 text-slate-300" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Thu phí học viên</h1>
          <p className="text-sm text-muted-foreground font-bold">{cls.name}</p>
        </div>

        {/* Action Form */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nhập liệu phiếu thu</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-tight">
              <ShieldCheck className="w-3 h-3" />
              Chế độ chờ duyệt
            </div>
          </div>
          <ReceiptForm members={membersWithDebt} />
        </div>

        {/* Workflow Info */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-200">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-400" />
              <h4 className="font-black text-sm uppercase tracking-widest">Quy trình duyệt phí</h4>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Chủ nhiệm lớp nhập phiếu thu thực tế từ học viên.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Hệ thống lưu trạng thái <strong className="text-white">PENDING_APPROVAL</strong>. Công nợ chưa thay đổi.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Admin đối soát ngân hàng/tiền mặt và nhấn <strong>Duyệt</strong> để chính thức ghi nhận doanh thu.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-card/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        </div>

      </div>
    </main>
  );
}
