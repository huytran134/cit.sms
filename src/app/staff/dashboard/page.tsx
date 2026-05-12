import { fetchStaffDashboardData } from "@/lib/actions/dashboard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, UserCheck, TrendingUp, BookOpen, ArrowRight, LayoutDashboard } from "lucide-react";

const CLASS_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PLANNED:     { label: "Dự kiến",      className: "bg-amber-50 text-amber-600 border-amber-100" },
  RECRUITING:  { label: "Đang tuyển",   className: "bg-sky-50 text-sky-600 border-sky-100" },
  IN_PROGRESS: { label: "Đang học",     className: "bg-green-50 text-green-600 border-green-100" },
  COMPLETED:   { label: "Đã kết thúc",  className: "bg-background text-muted-foreground border-border" },
  CANCELLED:   { label: "Đã hủy",       className: "bg-red-50 text-red-500 border-red-100" },
};

export default async function StaffDashboardPage() {
  const data = await fetchStaffDashboardData();
  if (!data) redirect("/login");

  const { user, leads, classes, totalClasses } = data;

  const statCards = [
    {
      label: "Tổng Lead phụ trách",
      value: leads.total,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      label: "Lead Mới",
      value: leads.NEW,
      icon: <Users className="w-5 h-5 text-sky-500" />,
      bg: "bg-sky-50",
      badge: "Mới",
      badgeClass: "bg-sky-100 text-sky-600",
    },
    {
      label: "Lead Tiềm năng",
      value: leads.POTENTIAL,
      icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-50",
      badge: "Tiềm năng",
      badgeClass: "bg-amber-100 text-amber-600",
    },
    {
      label: "Đã chuyển thành HV",
      value: leads.CONVERTED,
      icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-50",
      badge: "Đã chuyển",
      badgeClass: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Xin chào, {user.fullName}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Tổng quan công việc của bạn hôm nay.</p>
          </div>
        </div>

        {/* Recruitment stats */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
            Thống kê tuyển sinh
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((card) => (
              <div key={card.label} className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{card.value}</p>
                  <p className="text-[11px] font-semibold text-slate-400 leading-tight mt-0.5">{card.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Classes */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
            Danh sách lớp đang phụ trách ({totalClasses} lớp)
          </h2>

          {classes.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border p-16 rounded-3xl text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-medium italic text-sm">Chưa có lớp học nào được phân công.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_80px_120px] gap-4 px-5 py-3 bg-background border-b border-border">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã lớp</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên lớp</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sĩ số</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"></span>
              </div>

              <div className="divide-y divide-slate-50">
                {classes.map((cls) => {
                  const badge = CLASS_STATUS_MAP[cls.status] ?? { label: cls.status, className: "bg-muted text-muted-foreground border-border" };
                  return (
                    <div key={cls.id} className="px-5 py-4 flex flex-col gap-3 md:grid md:grid-cols-[1fr_2fr_1fr_80px_120px] md:items-center">
                      <span className="text-[11px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg uppercase tracking-widest w-fit">
                        {cls.classCode}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{cls.name}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider w-fit ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="text-sm font-bold text-muted-foreground">
                        {cls.memberCount} HV
                      </span>
                      <Link
                        href={`/staff/classes/${cls.id}/sessions`}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-black text-white hover:bg-blue-700 transition-colors uppercase tracking-widest w-fit md:w-auto"
                      >
                        Xem chi tiết
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
