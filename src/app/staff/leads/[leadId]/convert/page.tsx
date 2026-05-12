import React from "react";
import { notFound } from "next/navigation";
import { fetchLeadByIdAction } from "@/lib/actions/lead";
import { ConvertLeadForm } from "@/components/leads/convert-lead-form";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LeadStatus } from "@prisma/client";

interface ConvertPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

export default async function ConvertLeadPage({ params }: ConvertPageProps) {
  const { leadId } = await params;
  const lead = await fetchLeadByIdAction(leadId);

  if (!lead) {
    notFound();
  }

  // Nếu Lead đã được chuyển đổi, báo lỗi hoặc chuyển hướng
  if (lead.status === LeadStatus.CONVERTED) {
    return (
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-md mx-auto bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Lead đã được chuyển đổi</h1>
          <p className="text-muted-foreground text-sm">
            Khách hàng <strong>{lead.fullName}</strong> đã trở thành học viên chính thức trong hệ thống.
          </p>
          <div className="pt-4">
            <Link 
              href="/staff/leads"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách Lead
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Breadcrumbs / Back Link */}
        <Link 
          href="/leads"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách Lead
        </Link>

        {/* Header Section */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chuyển thành Học viên</h1>
            <p className="text-muted-foreground text-sm">Cấp hồ sơ chính thức cho khách hàng tiềm năng</p>
          </div>
        </div>

        {/* Form Section */}
        <ConvertLeadForm lead={lead} />

        {/* Security Note */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <div className="mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Bảo mật dữ liệu:</strong> Thông tin CCCD sẽ được mã hóa AES-256-GCM trước khi lưu vào cơ sở dữ liệu. 
            Chỉ những nhân sự có thẩm quyền (ADMIN) mới có thể truy cập thông tin này và mỗi lần truy cập đều được ghi nhật ký (Audit Log).
          </p>
        </div>
      </div>
    </main>
  );
}
