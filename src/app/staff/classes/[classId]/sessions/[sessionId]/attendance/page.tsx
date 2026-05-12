import React from "react";
import { prisma } from "@/lib/db";
import { fetchStudentsForSessionAction } from "@/lib/actions/attendance";
import { AttendanceForm } from "@/components/sessions/attendance-form";
import {
  ArrowLeft, CheckSquare, Presentation,
  Calendar, FileText, Info, Users
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface AttendancePageProps {
  params: Promise<{
    classId: string;
    sessionId: string;
  }>;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { classId, sessionId } = await params;

  // 1. Fetch Session Info
  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        select: {
          name: true,
          classCode: true,
        },
      },
    },
  });

  if (!session || session.classId !== classId) {
    notFound();
  }

  // 2. Fetch Students and their current attendance status
  const students = await fetchStudentsForSessionAction(sessionId);

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Navigation */}
        <Link
          href={`/staff/classes/${classId}/sessions`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Danh sách buổi học
        </Link>

        {/* Header Section */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-blue-100">
                  {session.class.classCode}
                </span>
                <CheckSquare className="w-4 h-4 text-slate-300" />
              </div>
              <h1 className="text-xl font-black text-foreground leading-tight">
                Điểm danh Buổi {session.sessionNumber}
              </h1>
              <p className="text-xs text-muted-foreground font-bold">{session.class.name}</p>
            </div>
            <div className="text-right">
              <Users className="w-5 h-5 text-slate-200 ml-auto" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {students.length} Học viên
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-background rounded-2xl border border-border">
            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung bài học</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {session.topic || "Không có nội dung chi tiết cho buổi học này."}
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
            Mặc định tất cả học viên được tích <strong>Có mặt</strong>.
            Bạn chỉ cần nhấn đổi trạng thái cho các học viên vắng mặt hoặc đi học bù.
          </p>
        </div>

        {/* Attendance Form - Managed by a single <form> inside the component */}
        {session.status === "PLANNED" ? (
          <AttendanceForm sessionId={sessionId} students={students} />
        ) : (
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center space-y-2">
            <p className="text-sm font-bold text-amber-700 uppercase">Buổi học này đã hoàn thành</p>
            <p className="text-xs text-amber-600">Bạn không thể chỉnh sửa điểm danh của buổi học đã đóng.</p>
          </div>
        )}

      </div>
    </main>
  );
}
