"use client";

import React, { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudentSchema, CreateStudentInput } from "@/lib/validation/student.schema";
import { registerStudentAction } from "@/lib/actions/student";
import { 
  User, Phone, Mail, Calendar, ShieldCheck, 
  Target, MessageSquare, Loader2, Info 
} from "lucide-react";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerStudentAction, null);

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema) as any,
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      gender: "Other",
      dateOfBirth: "",
      cccdNumber: "",
      consentCccd: false,
    },
  });

  const consentCccd = watch("consentCccd");

  // If consent is unchecked, clear the cccdNumber
  useEffect(() => {
    if (!consentCccd) {
      setValue("cccdNumber", "");
    }
  }, [consentCccd, setValue]);

  return (
    <div className="bg-card p-5 rounded-2xl shadow-xl border border-border mb-10">
      <form action={action} className="space-y-6">
        
        {/* Nhóm 1: Thông tin cá nhân */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <User className="w-3 h-3" /> Thông tin cá nhân
          </h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Họ và tên *</label>
            <input
              {...register("fullName")}
              placeholder="Nhập họ và tên"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Giới tính</label>
              <select
                {...register("gender")}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Ngày sinh</label>
              <input
                {...register("dateOfBirth")}
                type="date"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
            </div>
          </div>
        </div>

        {/* Nhóm 2: Liên hệ */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Phone className="w-3 h-3" /> Thông tin liên hệ
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Số điện thoại *</label>
            <input
              {...register("phone")}
              placeholder="09xxx"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>

        {/* Nhóm 3: Bảo mật (CCCD) */}
        <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Bảo mật & CCCD
          </h3>
          
          <div className="flex items-start gap-3">
            <input
              {...register("consentCccd")}
              id="consentCccd"
              type="checkbox"
              value="true" // Required for FormData to pick it up as "true" string
              className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="consentCccd" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Tôi đồng ý cho CiT EDU lưu trữ số CCCD này để phục vụ quản lý hồ sơ học tập. 
              Dữ liệu được mã hóa theo tiêu chuẩn AES-256.
            </label>
          </div>
          {errors.consentCccd && <p className="text-red-500 text-xs">{errors.consentCccd.message}</p>}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Số CCCD / CMND</label>
            <input
              {...register("cccdNumber")}
              disabled={!consentCccd}
              placeholder={consentCccd ? "Nhập 9 hoặc 12 số" : "Vui lòng tick đồng ý trước"}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${
                consentCccd 
                  ? "bg-card border-border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  : "bg-muted border-border cursor-not-allowed opacity-60"
              }`}
            />
            {errors.cccdNumber && <p className="text-red-500 text-xs mt-1">{errors.cccdNumber.message}</p>}
          </div>
        </div>

        {/* Nhóm 4: Câu hỏi bổ sung */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Target className="w-3 h-3" /> Mục tiêu & Động lực
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              Lý do bạn tham gia khóa học?
            </label>
            <textarea
              rows={3}
              placeholder="Chia sẻ ngắn gọn mong muốn của bạn..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              Mục tiêu của bạn trong 3 năm tới?
            </label>
            <textarea
              rows={3}
              placeholder="Bạn muốn đạt được điều gì sau lộ trình?"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y min-h-[100px]"
            />
          </div>
        </div>

        {/* Thông báo trạng thái */}
        {state && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${state.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{state.message}</p>
          </div>
        )}

        {/* Nút Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Đang gửi thông tin...
            </>
          ) : (
            "Đăng ký thông tin"
          )}
        </button>
      </form>
    </div>
  );
}
