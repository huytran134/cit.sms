import React from "react";
import { RegisterForm } from "@/components/students/register-form";
import { ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center">
      {/* Branding Header */}
      <div className="w-full bg-blue-600 pt-12 pb-24 px-6 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2">CiT EDU</h1>
        <p className="text-blue-100 text-sm font-medium">Hệ thống Quản lý Học viên Thông minh</p>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-md px-4 -mt-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground bg-card inline-block px-4 py-2 rounded-full shadow-sm border border-border">
            Đăng ký thông tin học viên
          </h2>
        </div>

        <RegisterForm />

        {/* Footer Info */}
        <div className="pb-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4" />
            <p className="text-[10px] uppercase tracking-widest font-bold">
              Bảo mật dữ liệu tuyệt đối
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto italic">
            Thông tin của bạn được bảo mật và quản lý nghiêm ngặt theo 
            <span className="font-semibold"> Nghị định 13/2023/NĐ-CP</span> về bảo vệ dữ liệu cá nhân.
          </p>
        </div>
      </div>
    </main>
  );
}
