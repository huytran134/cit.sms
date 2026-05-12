import React from "react";
import { fetchStudentByIdAction } from "@/lib/actions/student";
import { ViewCccdButton } from "@/components/students/view-cccd-button";
import { StudentStatusActions } from "@/components/students/student-status-actions";
import { StudentExceptionActions } from "@/components/students/student-exception-actions";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Lock,
  Briefcase, Calendar, Info, Heart, Target, Quote,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SystemRole } from "@prisma/client";

interface StudentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;
  const student = await fetchStudentByIdAction(id);

  if (!student) {
    notFound();
  }

  // Mocking roles for UI visibility (Consistent with actions)
  const userRoles: SystemRole[] = [SystemRole.ADMIN];
  const isAdmin = userRoles.includes(SystemRole.ADMIN);

  const InfoRow = ({ icon: Icon, label, value, colorClass = "text-muted-foreground" }: any) => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 bg-background rounded-lg">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium ${colorClass}`}>{value || "---"}</p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/staff/students"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </Link>

        {/* Profile Card */}
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 -z-0" />

          <div className="relative z-10 flex flex-col items-center gap-4 text-center mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center text-3xl font-black text-white">
              {student.fullName.charAt(0)}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-foreground">{student.fullName}</h1>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2.5 py-0.5 rounded-full uppercase border border-green-100">
                  {student.status}
                </span>
                {student.studentCode && (
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    #{student.studentCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-slate-50 pt-8">
            <InfoRow icon={Phone} label="Số điện thoại" value={student.phone} colorClass="text-foreground font-bold" />
            <InfoRow icon={Calendar} label="Ngày sinh" value={student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd/MM/yyyy") : "---"} />
            <InfoRow icon={User} label="Giới tính" value={student.gender === 'Male' ? 'Nam' : student.gender === 'Female' ? 'Nữ' : student.gender} />
            <InfoRow icon={Mail} label="Email" value={student.email} />
            <div className="col-span-2">
              <InfoRow icon={Briefcase} label="Nơi làm việc / Học tập" value={student.workplace} />
            </div>
            <div className="col-span-2">
              <InfoRow icon={MapPin} label="Địa chỉ hiện tại" value={student.currentAddress} />
            </div>
          </div>
        </div>

        {/* Financial Status Section */}
        {student.enrollments && student.enrollments.length > 0 && (
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tình trạng học phí</h2>
            </div>
            <div className="space-y-3">
              {student.enrollments.map((enrollment: any) => {
                const paid = enrollment.paymentReceipts.reduce((sum: number, r: any) => sum + r.amount, 0);
                const debt = Math.max(0, enrollment.tuitionFeeActual - paid);
                return (
                  <div key={enrollment.id} className="p-4 bg-background rounded-2xl border border-border space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{enrollment.class.classCode}</p>
                        <p className="text-xs font-bold text-foreground leading-tight">{enrollment.class.name}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                        debt === 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {debt === 0 ? "Hoàn thành" : "Còn nợ"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Học phí thực</p>
                        <p className="text-xs font-black text-foreground">{enrollment.tuitionFeeActual.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Số dư nợ</p>
                        <p className={`text-xs font-black ${debt > 0 ? "text-red-600" : "text-foreground"}`}>{debt.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>

                    {/* Admin Actions for Graduation/Withdrawal/Hold */}
                    {isAdmin && (
                      <StudentStatusActions 
                        classMemberId={enrollment.id} 
                        currentStatus={enrollment.status} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Motivational Info (Group D) */}
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Động lực học tập</h2>
          </div>

          <div className="space-y-6">
            <InfoRow icon={Target} label="Mục tiêu 3 năm" value={student.goal3Years} />
            <InfoRow icon={Heart} label="Lý do tham gia" value={student.reasonJoin} />
          </div>
        </div>

        {/* Security Section (CCCD) */}
        <div className="bg-background rounded-3xl p-6 border-2 border-dashed border-border space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-wider">Thông tin nhạy cảm</h2>
          </div>

          {isAdmin ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl text-xs text-indigo-700 border border-indigo-100">
                Lưu ý: Chỉ ADMIN mới có thể xem số CCCD. Mỗi lần xem sẽ được ghi nhật ký hệ thống để đảm bảo bảo mật dữ liệu.
              </div>
              <ViewCccdButton studentId={student.id} />
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Bạn không có quyền truy cập thông tin này.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
            <InfoRow icon={Calendar} label="Ngày cấp CCCD" value={student.cccdIssuedDate ? format(new Date(student.cccdIssuedDate), "dd/MM/yyyy") : "---"} />
            <InfoRow icon={MapPin} label="Nơi cấp" value={student.cccdIssuedPlace} />
          </div>
        </div>

        {/* Exception Actions (Task 5.2/5.3) */}
        <StudentExceptionActions isAdmin={isAdmin} />
        
        {/*
          // Logic yêu cầu của User về useSession (Chưa cài đặt next-auth)
          // import { useSession } from "next-auth";
          // const session = useSession();
          // const isAdmin = session?.user?.roles?.includes("ADMIN");
        */}
      </div>
    </main>
  );
}
