import React from "react";
import { prisma } from "@/lib/db";
import { enrollStudentsAction } from "@/lib/actions/class";
import {
  ArrowLeft, Users, UserCheck,
  Presentation, CheckCircle2, AlertCircle, Info
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EnrollPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function EnrollPage({ params }: EnrollPageProps) {
  const { classId } = await params;

  // 1. Fetch Class and current capacity
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      program: true,
      _count: {
        select: { members: true },
      },
    },
  });

  if (!cls) {
    notFound();
  }

  // 2. Fetch eligible students
  const eligibleStudents = await prisma.student.findMany({
    where: {
      status: {
        in: ["ASSIGNED",],
      },
      // Exclude those already in this class
      NOT: {
        enrollments: {
          some: {
            classId: classId,
          },
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      status: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const enrollActionWithId = enrollStudentsAction.bind(null, classId) as unknown as (formData: FormData) => Promise<void>;

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Back Link */}
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách lớp
        </Link>

        {/* Header Section */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-blue-100">
                  {cls.classCode}
                </span>
                <Presentation className="w-4 h-4 text-slate-300" />
              </div>
              <h1 className="text-xl font-black text-foreground">{cls.name}</h1>
              <p className="text-xs text-muted-foreground font-medium">{cls.program.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sĩ số hiện tại</p>
              <p className="text-xl font-black text-foreground">
                {cls._count.members} <span className="text-slate-300 text-sm font-bold">/ {cls.capacityMax}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-[11px] text-blue-700 leading-tight">
              Chọn các học viên bên dưới để xếp vào lớp này. Hệ thống sẽ tự động cập nhật trạng thái học viên thành <strong>Đã xếp lớp (ASSIGNED)</strong>.
            </p>
          </div>
        </div>

        {/* Enrollment Form */}
        <form action={enrollActionWithId} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" />
                Học viên đủ điều kiện ({eligibleStudents.length})
              </h2>
            </div>

            {eligibleStudents.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border p-12 rounded-3xl text-center space-y-3">
                <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium italic">Không có học viên nào sẵn sàng để xếp lớp.</p>
              </div>
            ) : (
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {eligibleStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-4 p-4 hover:bg-background transition-colors cursor-pointer group"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name="studentIds"
                          value={student.id}
                          className="peer w-6 h-6 rounded-lg border-2 border-border checked:bg-blue-600 checked:border-blue-600 transition-all appearance-none cursor-pointer"
                        />
                        <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                          {student.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter">
                          {student.phone} — <span className="uppercase">{student.status}</span>
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {eligibleStudents.length > 0 && (
            <div className="sticky bottom-8">
              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <UserCheck className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                Xếp lớp học viên đã chọn
              </button>
            </div>
          )}
        </form>

        {/* Warning Box */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-wider">Lưu ý quan trọng</h4>
            <p className="text-[10px] text-amber-600 leading-relaxed font-medium">
              Hành động này sẽ tạo hồ sơ đóng học phí (Debt: OWING).
              Vui lòng chỉ thực hiện khi đã xác nhận danh sách học viên sẽ tham gia lớp học này.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
