"use client";

import React, { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSessionSchema, CreateSessionInput } from "@/lib/validation/session.schema";
import { createSessionAction } from "@/lib/actions/session";
import { Calendar, FileText, Plus, Loader2, Info } from "lucide-react";

interface CreateSessionFormProps {
  classId: string;
}

export function CreateSessionForm({ classId }: CreateSessionFormProps) {
  const createSessionWithId = createSessionAction.bind(null, classId);
  const [state, action, isPending] = useActionState(createSessionWithId, null);

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<CreateSessionInput>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      sessionDate: "",
      topic: "",
    },
  });

  useEffect(() => {
    if (state?.success) {
      reset();
    }
  }, [state, reset]);

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Session Date */}
          <div className="space-y-2">
            <label htmlFor="sessionDate" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-500" />
              Ngày học <span className="text-red-500">*</span>
            </label>
            <input
              {...register("sessionDate")}
              id="sessionDate"
              name="sessionDate"
              type="date"
              className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-sm ${
                errors.sessionDate ? "border-red-500 bg-red-50" : "border-border focus:border-blue-500"
              }`}
            />
            {errors.sessionDate && (
              <p className="text-red-500 text-xs font-medium">{errors.sessionDate.message}</p>
            )}
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <label htmlFor="topic" className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3 text-blue-500" />
              Nội dung bài học
            </label>
            <input
              {...register("topic")}
              id="topic"
              name="topic"
              placeholder="Ví dụ: Giới thiệu về Tư duy"
              className={`w-full px-4 py-2.5 bg-background border rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500/20 text-sm ${
                errors.topic ? "border-red-500 bg-red-50" : "border-border focus:border-blue-500"
              }`}
            />
            {errors.topic && (
              <p className="text-red-500 text-xs font-medium">{errors.topic.message}</p>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {state && (
          <div className={`p-3 rounded-xl flex items-center gap-3 border ${
            state.success 
              ? "bg-green-50 border-green-100 text-green-700" 
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{state.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Thêm buổi học
            </>
          )}
        </button>
      </form>
    </div>
  );
}
