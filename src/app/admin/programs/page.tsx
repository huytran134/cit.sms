import React from "react";
import { ProgramForm } from "@/components/programs/program-form";
import { fetchProgramsAction } from "@/lib/actions/program";
import {
  Library, PlusCircle, LayoutGrid, Calendar,
  Layers, Wallet, BookOpen, Presentation
} from "lucide-react";

export default async function ProgramsAdminPage() {
  const programs = await fetchProgramsAction();

  const getBranchLabel = (branch: string) => {
    switch (branch) {
      case "thinking": return "Tư duy";
      case "skill": return "Kỹ năng";
      case "mentoring": return "Mật Thất";
      default: return branch;
    }
  };

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <Library className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Thiết lập Chương trình</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Quản lý cây chương trình học và học phí chuẩn.</p>
          </div>
        </div>

        {/* Section 1: Create Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <PlusCircle className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">Tạo chương trình mới</h2>
          </div>
          <ProgramForm />
        </div>

        {/* Section 2: Programs List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Danh mục hiện có ({programs.length})</h2>
            </div>
          </div>

          {programs.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-border p-20 rounded-3xl text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-medium italic">Chưa có chương trình nào được thiết lập.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100">
                          {program.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest border ${program.type === 'MENTORING'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-background text-muted-foreground border-border'
                          }`}>
                          {program.type}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-foreground group-hover:text-indigo-600 transition-colors">
                        {program.name}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Nhánh
                      </p>
                      <p className="text-sm font-bold text-slate-700">{getBranchLabel(program.branch)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Học phí
                      </p>
                      <p className="text-sm font-bold text-indigo-600">
                        {Number(program.tuitionFee).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Presentation className="w-3 h-3" />
                        Lớp học
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {program._count.classes} lớp đã mở
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Chu kỳ
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                        {program.feeCycle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-indigo-900 rounded-3xl p-6 text-white overflow-hidden relative shadow-xl shadow-indigo-200">
          <div className="relative z-10 space-y-2">
            <h4 className="font-black text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-300" />
              Lưu ý thiết lập
            </h4>
            <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
              Các chương trình thuộc nhánh <strong>Thinking</strong> thường có điều kiện tiên quyết.
              Các chương trình <strong>Mentoring</strong> (Mật Thất) sẽ tự động áp dụng chính sách KHÔNG hoàn tiền khi thu phí.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-card/5 rounded-full -mr-10 -mt-10 blur-2xl" />
        </div>
      </div>
    </main>
  );
}
