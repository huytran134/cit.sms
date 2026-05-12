import React from "react";
import { prisma } from "@/lib/db";
import { RefundForm } from "@/components/finance/refund-form";
import { 
  ArrowLeft, Banknote, ShieldCheck, 
  History, Info 
} from "lucide-react";
import Link from "next/link";

export default async function RefundsPage() {
  // Fetch ClassMembers for selection
  // Only for REGULAR classes (exclude MENTORING)
  const members = await prisma.classMember.findMany({
    where: {
      class: {
        program: {
          type: "REGULAR"
        }
      }
    },
    include: {
      student: {
        select: { fullName: true }
      },
      class: {
        select: { name: true, classCode: true }
      }
    }
  });

  const memberData = members.map(m => ({
    id: m.id,
    fullName: m.student.fullName,
    className: m.class.name,
    classCode: m.class.classCode
  }));

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

        {/* Header */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500 rounded-xl shadow-lg shadow-red-500/20">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground leading-tight">Hoàn tiền học phí</h1>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Administrative Refund Control</p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
            <strong>Lưu ý:</strong> Việc hoàn tiền chỉ áp dụng cho các lớp <strong>REGULAR</strong>. 
            Lớp Mật Thất (Mentoring) không hỗ trợ tính năng hoàn tiền tự động qua hệ thống.
          </p>
        </div>

        {/* Refund Form */}
        <RefundForm members={memberData} />

      </div>
    </main>
  );
}
