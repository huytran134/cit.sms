import React from "react";
import { ClassForm } from "@/components/classes/class-form";
import { fetchClassesAction } from "@/lib/actions/class";
import {
  Presentation, PlusCircle, LayoutGrid, Banknote,
  BookOpen, Users, Wallet, Globe, Calendar, Info,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default async function ClassesAdminPage() {
  const classes = await fetchClassesAction();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
        return <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-amber-100">Dự kiến</span>;
      case "OPENING":
        return <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-green-100">Đang mở</span>;
      case "ONGOING":
        return <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-blue-100">Đang học</span>;
      case "CLOSED":
        return <span className="text-[10px] font-bold bg-background text-muted-foreground px-2.5 py-1 rounded-lg uppercase tracking-wider border border-border">Đã đóng</span>;
      default:
        return <span className="text-[10px] font-bold bg-background text-muted-foreground px-2.5 py-1 rounded-lg uppercase tracking-wider border border-border">{status}</span>;
    }
  };

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                <Presentation className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Quản lý Lớp học</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Khởi tạo và thiết lập các lớp học mới cho trung tâm.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/admin/dashboard"
              className="flex items-center gap-2 rounded-2xl bg-card border border-border px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-background transition-all uppercase tracking-widest shadow-sm"
            >
              <LayoutGrid className="w-4 h-4 text-blue-500" />
              Tổng quan
            </Link>
            <Link
              href="/admin/finance/approvals"
              className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-black text-amber-700 hover:bg-amber-100 transition-all uppercase tracking-widest"
            >
              <ShieldCheck className="w-4 h-4" />
              Duyệt phiếu thu
            </Link>
            <Link
              href="/admin/finance/refunds"
              className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-100 transition-all uppercase tracking-widest"
            >
              <Banknote className="w-4 h-4" />
              Hoàn tiền
            </Link>
          </div>
        </div>

        {/* Section 1: Create Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <PlusCircle className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Mở lớp học mới</h2>
          </div>
          <ClassForm />
        </div>

        {/* Section 2: Classes List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Danh sách lớp ({classes.length})</h2>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border p-20 rounded-3xl text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-medium italic">Chưa có lớp học nào được khởi tạo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/admin/classes/${cls.id}`}
                  className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md hover:border-blue-100 transition-all group cursor-pointer block"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-blue-100">
                          {cls.classCode}
                        </span>
                        {getStatusBadge(cls.status)}
                      </div>
                      <h3 className="text-base font-black text-foreground group-hover:text-blue-600 transition-colors">
                        {cls.name}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        {cls.program.name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-300" />
                        Hình thức
                      </p>
                      <p className="text-xs font-bold text-slate-700">{cls.format}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-300" />
                        Sĩ số tối đa
                      </p>
                      <p className="text-xs font-bold text-slate-700">{cls.capacityMax} học viên</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-slate-300" />
                        Học phí
                      </p>
                      <p className="text-xs font-bold text-blue-600">{Number(cls.tuitionFee).toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        Loại lịch
                      </p>
                      <p className="text-xs font-bold text-slate-700 uppercase">{cls.scheduleType}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-200">
          <div className="relative z-10 space-y-2">
            <h4 className="font-black text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Quy tắc hệ thống
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Mã lớp được sinh tự động: Lớp thường{" "}
              <code className="text-blue-400 font-bold">[CODE]_[YY].[Seq]</code>
              {" "}(VD: TDTD_17.1) — Mật Thất{" "}
              <code className="text-blue-400 font-bold">[CODE]_[YYYY].[Seq]</code>
              {" "}(VD: MAT_THAT_2026.1). YY = Năm khai giảng − 2009.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-card/5 rounded-full -mr-10 -mt-10 blur-2xl" />
        </div>
      </div>
    </main>
  );
}
