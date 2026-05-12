"use client";

import React, { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProgramSchema, CreateProgramInput } from "@/lib/validation/program.schema";
import { createProgramAction } from "@/lib/actions/program";
import { 
  BookOpen, Code, Tag, Layers, 
  Coins, FileText, Loader2, Info, Calendar 
} from "lucide-react";

export function ProgramForm() {
  const [state, action, isPending] = useActionState(createProgramAction, null);

  const {
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateProgramInput>({
    resolver: zodResolver(createProgramSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      branch: "thinking",
      feeCycle: "COURSE",
      type: "REGULAR",
      tuitionFee: 0,
      description: "",
    },
  });

  const selectedType = watch("type");

  // Reset form on success
  useEffect(() => {
    if (state?.success) {
      reset();
    }
  }, [state, reset]);

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
      <form action={action} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Program Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Tên chương trình <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              id="name"
              name="name"
              placeholder="Ví dụ: Tư duy Tài năng"
              className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${
                errors.name ? "border-red-500 bg-red-50" : "border-border focus:border-indigo-500"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Program Code */}
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              Mã code (2-6 chữ hoa) <span className="text-red-500">*</span>
            </label>
            <input
              {...register("code")}
              id="code"
              name="code"
              placeholder="VD: TDTN"
              className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${
                errors.code ? "border-red-500 bg-red-50" : "border-border focus:border-indigo-500"
              }`}
            />
            {errors.code && (
              <p className="text-red-500 text-xs font-medium">{errors.code.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              Loại hình <span className="text-red-500">*</span>
            </label>
            <select
              {...register("type")}
              id="type"
              name="type"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="REGULAR">Lớp thường (Regular)</option>
              <option value="MENTORING">Lớp Mật Thất (Mentoring)</option>
            </select>
          </div>

          {/* Tuition Fee */}
          <div className="space-y-2">
            <label htmlFor="tuitionFee" className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-500" />
              Học phí chuẩn <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("tuitionFee")}
                id="tuitionFee"
                name="tuitionFee"
                type="number"
                placeholder="0"
                className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${
                  errors.tuitionFee ? "border-red-500 bg-red-50" : "border-border focus:border-indigo-500"
                }`}
              />
              <span className="absolute right-4 top-2.5 text-sm font-bold text-slate-400">VNĐ</span>
            </div>
            {errors.tuitionFee && (
              <p className="text-red-500 text-xs font-medium">{errors.tuitionFee.message}</p>
            )}
          </div>

          {/* Conditional: Branch (Hidden if Mentoring) */}
          {selectedType === "REGULAR" && (
            <div className="space-y-2">
              <label htmlFor="branch" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Nhánh chương trình <span className="text-red-500">*</span>
              </label>
              <select
                {...register("branch")}
                id="branch"
                name="branch"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="thinking">Tư duy (Thinking)</option>
                <option value="skill">Kỹ năng (Skill)</option>
              </select>
            </div>
          )}

          {/* Fee Cycle (Filtered if Mentoring) */}
          <div className="space-y-2">
            <label htmlFor="feeCycle" className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Chu kỳ thu học phí <span className="text-red-500">*</span>
            </label>
            <select
              {...register("feeCycle")}
              id="feeCycle"
              name="feeCycle"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {selectedType === "REGULAR" ? (
                <option value="COURSE">Theo khóa học</option>
              ) : (
                <>
                  <option value="HALF_YEAR">Theo 6 tháng (Nửa năm)</option>
                  <option value="YEAR">Theo năm (12 tháng)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            Mô tả thêm
          </label>
          <textarea
            {...register("description")}
            id="description"
            name="description"
            rows={3}
            placeholder="Mô tả ngắn gọn về chương trình..."
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Feedback Message */}
        {state && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            state.success 
              ? "bg-green-50 border-green-100 text-green-700" 
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{state.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tạo chương trình...
            </>
          ) : (
            "Xác nhận tạo chương trình"
          )}
        </button>
      </form>
    </div>
  );
}
