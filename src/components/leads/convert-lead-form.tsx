"use client";

import React, { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudentSchema, CreateStudentInput } from "@/lib/validation/student.schema";
import { convertLeadToStudentAction, type ActionResponse } from "@/lib/actions/lead";
import { User, Phone, IdCard, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConvertLeadFormProps {
  lead: {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
  };
}

export function ConvertLeadForm({ lead }: ConvertLeadFormProps) {
  const router = useRouter();
  
  // Create a version of the action that includes the leadId
  const convertActionWithId = convertLeadToStudentAction.bind(null, lead.id);
  
  const [state, action, isPending] = useActionState<ActionResponse | null, FormData>(convertActionWithId as any, null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema) as any,
    defaultValues: {
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email || "",
      gender: "",
      dateOfBirth: "",
      cccdNumber: "",
      consentCccd: false,
    },
  });

  // Effect to handle success redirect
  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.push("/staff/leads");
        router.refresh();
      }, 1500);
    }
  }, [state, router]);

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-6">
      <div className="border-b border-slate-50 pb-4">
        <h3 className="text-lg font-bold text-slate-800">Thông tin chuyển đổi</h3>
        <p className="text-muted-foreground text-xs">Vui lòng hoàn thiện các thông tin còn thiếu để tạo hồ sơ học viên.</p>
      </div>

      <form action={action} className="space-y-6">
        {/* Read Only Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Họ và tên</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-lg text-muted-foreground cursor-not-allowed">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{lead.fullName}</span>
            </div>
            <input type="hidden" name="fullName" value={lead.fullName} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Số điện thoại</label>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-lg text-muted-foreground cursor-not-allowed">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">{lead.phone}</span>
            </div>
            <input type="hidden" name="phone" value={lead.phone} />
          </div>
        </div>

        <div className="h-px bg-muted" />

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender */}
          <div className="space-y-2">
            <label htmlFor="gender" className="text-sm font-semibold text-slate-700">Giới tính</label>
            <select
              {...register("gender")}
              id="gender"
              name="gender"
              className={`w-full px-4 py-2.5 bg-card border rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
                errors.gender ? "border-red-500 bg-red-50" : "border-border focus:border-blue-500"
              }`}
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs font-medium mt-1">{errors.gender.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="text-sm font-semibold text-slate-700">Ngày sinh</label>
            <div className="relative">
              <input
                {...register("dateOfBirth")}
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={`w-full px-4 py-2.5 bg-card border rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
                  errors.dateOfBirth ? "border-red-500 bg-red-50" : "border-border focus:border-blue-500"
                }`}
              />
            </div>
            {errors.dateOfBirth && (
              <p className="text-red-500 text-xs font-medium mt-1">{errors.dateOfBirth.message}</p>
            )}
          </div>
        </div>

        {/* CCCD Number */}
        <div className="space-y-4 p-5 bg-blue-50/50 border border-blue-100 rounded-xl">
          <div className="space-y-2">
            <label htmlFor="cccdNumber" className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <IdCard className="w-4 h-4" />
              Số CCCD (12 số) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("cccdNumber")}
              id="cccdNumber"
              name="cccdNumber"
              placeholder="Nhập 12 số CCCD"
              className={`w-full px-4 py-2.5 bg-card border rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${
                errors.cccdNumber ? "border-red-500" : "border-blue-200 focus:border-blue-500"
              }`}
            />
            {errors.cccdNumber && (
              <p className="text-red-500 text-xs font-medium mt-1">{errors.cccdNumber.message}</p>
            )}
          </div>

          {/* Consent */}
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <input
                {...register("consentCccd")}
                type="checkbox"
                id="consentCccd"
                name="consentCccd"
                className="w-4 h-4 text-blue-600 bg-muted border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <label htmlFor="consentCccd" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Tôi xác nhận học viên đã đồng ý cung cấp và cho phép hệ thống lưu trữ thông tin CCCD phục vụ mục đích quản lý đào tạo.
            </label>
          </div>
          {errors.consentCccd && (
            <p className="text-red-500 text-[10px] font-medium">{errors.consentCccd.message}</p>
          )}
        </div>

        {/* Feedback Message */}
        {state && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border ${
            state.success 
              ? "bg-green-50 border-green-100 text-green-700" 
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
            {state.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <div className="text-sm font-medium leading-tight">
              {state.message}
              {state.success && <p className="text-xs opacity-70 mt-1">Đang chuyển hướng về danh sách...</p>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-4 border border-border text-muted-foreground font-semibold rounded-xl hover:bg-background transition-all active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isPending || state?.success}
            className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận chuyển đổi"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
