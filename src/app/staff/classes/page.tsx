import React from "react";
import { fetchClassesForStaffAction } from "@/lib/actions/class";
import {
  Presentation, BookOpen, Users, Wallet,
  Globe, Calendar, ArrowRight, LayoutGrid
} from "lucide-react";
import Link from "next/link";

export default async function StaffClassesPage() {
  const classes = await fetchClassesForStaffAction();

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
              <h1 className="text-2xl font-black text-foreground tracking-tight">Lớp học của tôi</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Quản lý buổi học, điểm danh và tài chính lớp phụ trách.</p>
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Danh sách lớp ({classes.length})</h2>
          </div>

          {classes.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border p-20 rounded-3xl text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-medium italic">Chưa có lớp học nào được phân công.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-blue-100">
                          {cls.classCode}
                        </span>
                        {getStatusBadge(cls.status)}
                      </div>
                      <h3 className="text-base font-black text-foreground">{cls.name}</h3>
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
                      <p className="text-xs font-bold text-blue-600">{Number(cls.tuitionFee).toLocaleString("vi-VN")}đ</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        Loại lịch
                      </p>
                      <p className="text-xs font-bold text-slate-700 uppercase">{cls.scheduleType}</p>
                    </div>
                  </div>

                  {/* Staff Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3">
                    <Link
                      href={`/staff/classes/${cls.id}/sessions`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 py-2 text-[10px] font-black text-white hover:bg-blue-700 transition-all uppercase tracking-widest"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Buổi học
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </Link>
                    <Link
                      href={`/staff/classes/${cls.id}/finance`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-muted px-3 py-2 text-[10px] font-black text-muted-foreground hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      Tài chính
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
