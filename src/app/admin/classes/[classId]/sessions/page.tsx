import React from "react";
import { prisma } from "@/lib/db";
import { fetchSessionsAction, cancelSessionAction } from "@/lib/actions/session";
import { CreateSessionForm } from "@/components/sessions/create-session-form";
import { GenerateSessionsButton } from "@/components/sessions/generate-sessions-button";
import {
  ArrowLeft, Calendar, FileText, Ban, Info,
  Clock, Presentation,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CopyFeedbackButton } from "@/components/portal/copy-feedback-button";

interface AdminSessionsPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function AdminSessionsPage({ params }: AdminSessionsPageProps) {
  const { classId } = await params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, classCode: true, status: true },
  });

  if (!cls) {
    notFound();
  }

  const sessions = await fetchSessionsAction(classId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
        return <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-widest">Dự kiến</span>;
      case "COMPLETED":
        return <span className="text-[9px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 uppercase tracking-widest">Hoàn thành</span>;
      case "CANCELLED":
        return <span className="text-[9px] font-black bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest">Đã hủy</span>;
      default:
        return <span className="text-[9px] font-black bg-background text-slate-400 px-2 py-0.5 rounded border border-border uppercase tracking-widest">{status}</span>;
    }
  };

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

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">
              {cls.classCode}
            </span>
            <Presentation className="w-4 h-4 text-slate-300" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Quản lý Buổi học</h1>
          <p className="text-sm text-muted-foreground font-bold">{cls.name}</p>
        </div>

        {/* Create Form Section */}
        {cls.status === "IN_PROGRESS" && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Lên lịch buổi học mới</h2>
            <GenerateSessionsButton classId={classId} />
            <CreateSessionForm classId={classId} />
          </div>
        )}

        {/* Sessions List Section */}
        <div className="space-y-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Lộ trình học tập ({sessions.length})</h2>

          {sessions.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border p-12 rounded-3xl text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 text-sm font-medium italic">Chưa có buổi học nào được lên lịch.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const isCancelled = session.status === "CANCELLED";
                const cancelActionWithId = cancelSessionAction.bind(null, session.id) as unknown as () => Promise<void>;
                return (
                  <div
                    key={session.id}
                    className={`bg-card rounded-3xl p-5 border border-border shadow-sm transition-all relative overflow-hidden ${isCancelled ? "opacity-50 grayscale" : "hover:border-blue-100"}`}
                  >
                    {isCancelled ? (
                      <div className="line-through decoration-red-500/30 decoration-2">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Buổi {session.sessionNumber}</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <h3 className="text-sm font-black text-foreground">
                                {format(new Date(session.sessionDate), "EEEE, dd/MM/yyyy", { locale: vi })}
                              </h3>
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-background rounded-2xl">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            {session.topic || "Không có nội dung chi tiết"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={`/staff/classes/${classId}/sessions/${session.id}/attendance`}
                        className="block cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Buổi {session.sessionNumber}</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <h3 className="text-sm font-black text-foreground group-hover:text-blue-600 transition-colors">
                                {format(new Date(session.sessionDate), "EEEE, dd/MM/yyyy", { locale: vi })}
                              </h3>
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-background rounded-2xl group-hover:bg-blue-50 transition-colors">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                            {session.topic || "Không có nội dung chi tiết"}
                          </p>
                        </div>
                      </Link>
                    )}

                    {!isCancelled && (
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          {session.status === "COMPLETED" && (
                            <CopyFeedbackButton sessionId={session.id} />
                          )}
                          {session.status === "PLANNED" && (
                            <form action={cancelActionWithId}>
                              <button
                                type="submit"
                                className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                              >
                                <Ban className="w-3 h-3" />
                                Hủy buổi học
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rule Box */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-slate-200">
          <div className="relative z-10 space-y-2">
            <h4 className="font-black text-sm flex items-center gap-2 uppercase tracking-widest">
              <Info className="w-4 h-4 text-blue-400" />
              Nguyên tắc Rolling Window
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Buổi học nên được tạo thủ công cho ít nhất 2-3 tuần tới để học viên nắm bắt lộ trình.
              Chỉ <strong>Quản trị viên (Admin)</strong> mới có quyền hủy buổi học đã lên lịch.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-card/5 rounded-full -mr-12 -mt-12 blur-xl" />
        </div>

      </div>
    </main>
  );
}
