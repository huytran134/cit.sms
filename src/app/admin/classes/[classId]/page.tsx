import React from "react";
import { prisma } from "@/lib/db";
import { assignStaffAction, fetchStaffUsersAction } from "@/lib/actions/class";
import { KickoffButton } from "@/components/classes/kickoff-button";
import { CancelClassButton } from "@/components/classes/cancel-class-button";
import { ExportButton } from "@/components/export/export-button";
import { exportClassStudentList } from "@/lib/actions/export";
import { auth } from "@/auth";
import {
  ArrowLeft, Users, UserPlus,
  ShieldCheck, GraduationCap, Briefcase,
  Calendar, MapPin, Wallet, LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ClassDetailPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { classId } = await params;
  const session = await auth();
  const isAdmin = (session?.user as any)?.roles?.includes("ADMIN") ?? false;

  // 1. Fetch Class with Program, Staff (and User info), and Members
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      program: true,
      staff: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
      members: {
        include: {
          student: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!cls) {
    notFound();
  }

  // 2. Fetch Users kèm systemRoles cho dropdown phân công
  const allUsers = await fetchStaffUsersAction();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "teacher": return "Giảng viên";
      case "teaching_assistant": return "Trợ giảng";
      case "class_leader": return "Chủ nhiệm lớp";
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
        return <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-wider">Dự kiến</span>;
      case "IN_PROGRESS":
        return <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-lg border border-green-100 uppercase tracking-wider">Đang học</span>;
      default:
        return <span className="text-[10px] font-bold bg-background text-muted-foreground px-2.5 py-1 rounded-lg border border-border uppercase tracking-wider">{status}</span>;
    }
  };

  const assignActionWithId = assignStaffAction.bind(null, classId) as unknown as (formData: FormData) => Promise<void>;

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link 
          href="/admin/classes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Danh sách lớp học
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: Class Info & Kickoff */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Class Header Card */}
            <div className="bg-card rounded-3xl p-8 shadow-sm border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-10 -mt-10" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest">
                        {cls.classCode}
                      </span>
                      {getStatusBadge(cls.status)}
                    </div>
                    <h1 className="text-3xl font-black text-foreground leading-tight">{cls.name}</h1>
                    <p className="text-muted-foreground font-bold flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      {cls.program.name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học phí</p>
                    <p className="text-sm font-black text-foreground">{cls.tuitionFee.toNumber().toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sĩ số</p>
                    <p className="text-sm font-black text-foreground">{cls._count.members} / {cls.capacityMax}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hình thức</p>
                    <p className="text-sm font-black text-foreground">{cls.format}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại lịch</p>
                    <p className="text-sm font-black text-foreground uppercase">{cls.scheduleType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kickoff Section */}
            {cls.status !== "IN_PROGRESS" && (
              <KickoffButton classId={classId} />
            )}

            {/* Hủy lớp — chỉ Admin */}
            <CancelClassButton
              classId={classId}
              isAdmin={isAdmin}
              currentStatus={cls.status}
            />

            {/* Members Section */}
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Danh sách học viên</h2>
                </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/admin/classes/${classId}/sessions`}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Quản lý buổi học
                </Link>
                <Link
                  href={`/admin/classes/${classId}/finance`}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Thu phí học phí
                </Link>
                <Link
                  href={`/admin/classes/${classId}/enroll`}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  + Thêm học viên
                </Link>
                <ExportButton
                  label="Xuất danh sách"
                  action={exportClassStudentList.bind(null, classId)}
                  variant="green"
                />
              </div>
              </div>

              {cls.members.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-xs text-slate-400 italic">Chưa có học viên nào được xếp lớp.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(() => {
                    const activeStatuses = ['ENROLLED', 'STUDYING', 'ON_HOLD'];
                    const displayMembers = cls.members.filter(member => activeStatuses.includes(member.status));
                    
                    return displayMembers.map((member) => (
                      <div key={member.id} className="py-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            {member.student.fullName.charAt(0)}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-800">{member.student.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{member.student.phone}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                          member.status === 'ON_HOLD' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-background text-slate-400 border-border'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: Staff & Actions */}
          <div className="space-y-6">
            
            {/* Staff Section */}
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Nhân sự phụ trách</h2>
              </div>

              <div className="space-y-4">
                {cls.staff.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-background rounded-2xl border border-border">
                    <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                      <Briefcase className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{s.user.fullName}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                        s.role === 'class_leader' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-muted-foreground'
                      }`}>
                        {getRoleLabel(s.role)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Staff Form */}
              <div className="pt-6 border-t border-slate-50">
                <form action={assignActionWithId} className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    Phân công thêm
                  </p>
                  <select 
                    name="userId" 
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {allUsers.map(u => {
                      const roleLabel = u.systemRoles.map(r => {
                        if (r.roleId === "ADMIN") return "Admin";
                        if (r.roleId === "CLASS_LEADER") return "Chủ nhiệm lớp";
                        if (r.roleId === "TEACHER") return "Giảng viên";
                        return r.roleId;
                      }).join(", ");
                      return (
                        <option key={u.id} value={u.id}>{u.fullName} — {roleLabel}</option>
                      );
                    })}
                  </select>
                  <select 
                    name="role" 
                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="teacher">Giảng viên</option>
                    <option value="teaching_assistant">Trợ giảng</option>
                    <option value="class_leader">Chủ nhiệm lớp</option>
                  </select>
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all active:scale-[0.98]"
                  >
                    Xác nhận phân công
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Links / Navigation */}
            <div className="bg-indigo-900 rounded-3xl p-6 text-white space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300">Công cụ bổ trợ</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-card/10 rounded-2xl border border-white/10 cursor-not-allowed opacity-50">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-xs font-bold">Xếp lịch học (Sớm ra mắt)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-card/10 rounded-2xl border border-white/10 cursor-not-allowed opacity-50">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold">Quản lý phòng học</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
