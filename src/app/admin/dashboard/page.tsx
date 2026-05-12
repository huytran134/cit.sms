import React from "react";
import { fetchDashboardDataAction } from "@/lib/actions/dashboard";
import { 
  Banknote, Wallet, Clock, Users, 
  Presentation, ShieldCheck,
  TrendingUp, Calendar, AlertTriangle,
  UserPlus, CheckCircle2, Info
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const data = await fetchDashboardDataAction();
  const today = format(new Date(), "EEEE, 'ngày' dd 'tháng' MM 'năm' yyyy", { locale: vi });

  if (!data) return null;

  const BlockHeader = ({ icon: Icon, title, colorClass }: any) => (
    <div className="flex items-center gap-2 mb-4 px-1">
      <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>
      <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${colorClass}`}>{title}</h2>
    </div>
  );

  const StatCard = ({ label, value, subtext, colorClass = "text-foreground" }: any) => (
    <div className="bg-background/50 rounded-2xl p-4 border border-border hover:border-border transition-colors">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-lg font-black tracking-tight ${colorClass}`}>{value}</p>
      {subtext && <p className="text-[9px] font-bold text-slate-400 italic mt-0.5">{subtext}</p>}
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Hệ thống Điều hành CiT EDU</h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            Báo cáo thời gian thực • {today}
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Block 1: Tài chính */}
          <section className="bg-card rounded-3xl p-6 border border-border shadow-sm space-y-4">
            <BlockHeader icon={ShieldCheck} title="Tài chính" colorClass="text-green-600" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Doanh thu xác nhận" value={`${data.finance.totalRevenue.toLocaleString('vi-VN')}đ`} colorClass="text-green-600" />
              <StatCard label="Công nợ hiện tại" value={`${data.finance.totalDebt.toLocaleString('vi-VN')}đ`} colorClass="text-amber-600" />
              <StatCard label="Nợ xấu không thu hồi" value={`${data.finance.totalBadDebt.toLocaleString('vi-VN')}đ`} colorClass="text-slate-400" />
              <StatCard label="Chờ duyệt" value={data.finance.pendingApprovals} colorClass="text-red-600" />
            </div>
            <Link 
              href="/admin/finance/approvals"
              className="flex items-center justify-between p-3 bg-background rounded-2xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted transition-all"
            >
              <span>Xem chi tiết danh sách chờ duyệt</span>
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </Link>
          </section>

          {/* Block 2: Vận hành Lớp học */}
          <section className="bg-card rounded-3xl p-6 border border-border shadow-sm space-y-4">
            <BlockHeader icon={Presentation} title="Vận hành Lớp học" colorClass="text-blue-600" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Học viên đang học" value={data.operations.totalStudying} />
              <StatCard label="Lớp hoạt động" value={data.operations.activeClasses} />
              <StatCard label="Buổi học tuần này" value={data.operations.sessionsThisWeek} />
              <StatCard label="Vắng mặt tuần này" value={data.operations.absentThisWeek} colorClass={data.operations.absentThisWeek > 0 ? "text-orange-600" : "text-foreground"} />
            </div>
          </section>

          {/* Block 3: Tuyển sinh */}
          <section className="bg-card rounded-3xl p-6 border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <BlockHeader icon={UserPlus} title="Tuyển sinh" colorClass="text-purple-600" />
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                data.admissions.conversionRate > 30 ? "bg-green-50 text-green-600 border-green-100" : 
                data.admissions.conversionRate < 10 ? "bg-red-50 text-red-600 border-red-100" : "bg-background text-muted-foreground border-border"
              }`}>
                Tỷ lệ chuyển đổi: {data.admissions.conversionRate}%
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-purple-50/50 border border-purple-100 rounded-3xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Tiềm năng mới</p>
                  <p className="text-2xl font-black text-purple-900">{data.admissions.totalLeads}</p>
                </div>
                <div className="p-3 bg-card rounded-2xl shadow-sm border border-purple-100">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              
              <div className="flex flex-col justify-center space-y-3 px-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Chưa tư vấn</span>
                  <span className="text-foreground">{data.admissions.unconsultedLeads}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Đã tư vấn</span>
                  <span className="text-foreground">{data.admissions.consultedLeads}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: `${data.admissions.conversionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Đã chuyển đổi (HV)</span>
                  <span className="text-green-600">{data.admissions.convertedCount}</span>
                </div>
              </div>
            </div>
          </section>

        </div>

      </div>
    </main>
  );
}

