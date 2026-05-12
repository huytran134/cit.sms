import React from "react";
import { fetchStudentsAction } from "@/lib/actions/student";
import { GraduationCap, Phone, Calendar, ChevronRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function StudentsPage() {
  const students = await fetchStudentsAction();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">Chờ lớp</span>;
      case "STUDYING":
        return <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-100">Đang học</span>;
      case "GRADUATED":
        return <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">Tốt nghiệp</span>;
      default:
        return <span className="text-[10px] font-bold bg-background text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider border border-border">{status}</span>;
    }
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý Học viên</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Danh sách học viên chính thức trong hệ thống.
          </p>
        </div>

        {/* Search/Filter (Placeholder) */}
        <div className="bg-card p-3 rounded-xl border border-border shadow-sm flex items-center gap-2">
          <div className="flex-1 text-sm text-slate-400 px-2 italic">
            Tìm kiếm theo tên hoặc SĐT... (Tính năng đang phát triển)
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Tổng số ({students.length})
            </h2>
          </div>

          {students.length === 0 ? (
            <div className="bg-card border border-dashed border-slate-300 p-12 rounded-2xl text-center">
              <p className="text-slate-400 text-sm italic">Chưa có học viên nào trong hệ thống</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {students.map((student) => (
                <Link 
                  key={student.id} 
                  href={`/staff/students/${student.id}`}
                  className="block group"
                >
                  <div className="bg-card p-4 rounded-2xl border border-border shadow-sm group-hover:shadow-md group-hover:border-indigo-100 transition-all active:scale-[0.98]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                          {student.fullName}
                        </h3>
                        {student.studentCode && (
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            {student.studentCode}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(student.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
                            <Phone className="w-3 h-3 text-slate-400" />
                          </div>
                          <span className="font-medium tracking-tight">{student.phone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-slate-300" />
                          </div>
                          <span>Nhập học: {format(new Date(student.createdAt), "dd/MM/yyyy")}</span>
                        </div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-background group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <p className="text-[11px] text-indigo-700/70 leading-relaxed italic">
            <strong>Mẹo:</strong> Bấm vào thẻ học viên để xem chi tiết hồ sơ, quá trình học tập và thông tin CCCD (dành cho Admin).
          </p>
        </div>
      </div>
    </main>
  );
}
