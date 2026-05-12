import React from "react";
import { CreateLeadForm } from "@/components/leads/create-lead-form";
import { fetchLeadsAction } from "@/lib/actions/lead";
import { Users, Calendar, Phone, Share2, ClipboardList, UserPlus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function LeadsPage() {
  const leads = await fetchLeadsAction();

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý Lead</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tạo và quản lý khách hàng tiềm năng.
          </p>
        </div>

        {/* Section 1: Create Form */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Tạo khách hàng mới
          </h2>
          <CreateLeadForm />
        </div>

        {/* Section 2: Leads List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Danh sách khách hàng tiềm năng ({leads.length})
          </h2>
          
          {leads.length === 0 ? (
            <div className="bg-card border border-dashed border-slate-300 p-10 rounded-xl text-center">
              <p className="text-slate-400 text-sm italic">Chưa có khách hàng tiềm năng nào</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {leads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground">{lead.fullName}</h3>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Lead
                      </span>
                      {lead.status !== 'CONVERTED' && (
                        <Link 
                          href={`/staff/leads/${lead.id}/convert`}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-100/50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          Chuyển thành HV
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{lead.phone}</span>
                    </div>
                    
                    {lead.source && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{lead.source}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 pt-2 border-t border-slate-50">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(lead.createdAt), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note Section */}
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Ghi chú:</strong> Dữ liệu này chỉ phục vụ mục đích Telesale. 
            Thông tin sẽ được mã hóa và bảo mật khi chuyển sang hồ sơ Học viên chính thức.
          </p>
        </div>
      </div>
    </main>
  );
}

