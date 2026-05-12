"use client";

import React, { useActionState, useEffect, useState } from "react";
import { recordAttendanceAction } from "@/lib/actions/attendance";
import { 
  CheckCircle2, XCircle, HelpCircle, 
  RefreshCcw, UserCheck, Loader2, Info 
} from "lucide-react";

interface StudentAttendance {
  studentId: string;
  fullName: string;
  phone: string;
  currentStatus: string;
}

interface AttendanceFormProps {
  sessionId: string;
  students: StudentAttendance[];
}

export function AttendanceForm({ sessionId, students }: AttendanceFormProps) {
  const recordAttendanceWithId = recordAttendanceAction.bind(null, sessionId);
  const [state, action, isPending] = useActionState(recordAttendanceWithId, null);

  // Status mapping
  const statuses = [
    { value: "PRESENT", label: "Có mặt", color: "bg-green-500", text: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    { value: "ABSENT", label: "Vắng KP", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { value: "EXCUSED", label: "Có phép", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { value: "MAKEUP", label: "Học bù", color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  ];

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        {students.map((student) => (
          <div 
            key={student.studentId}
            className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <div className="space-y-0.5">
                <p className="text-sm font-black text-foreground uppercase tracking-tight">{student.fullName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{student.phone}</p>
              </div>
            </div>

            {/* Attendance Status Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statuses.map((s) => (
                <label 
                  key={s.value}
                  className="relative cursor-pointer group"
                >
                  <input 
                    type="radio" 
                    name={`attendance-${student.studentId}`} 
                    value={s.value}
                    defaultChecked={student.currentStatus === s.value}
                    className="peer sr-only"
                  />
                  <div className={`
                    w-full py-2.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-wider text-center transition-all
                    peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white
                    peer-not-checked:border-slate-50 peer-not-checked:bg-background peer-not-checked:text-slate-400
                    hover:border-border
                  `}>
                    {s.label}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Message */}
      {state && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
          state.success 
            ? "bg-green-50 border-green-100 text-green-700" 
            : "bg-red-50 border-red-100 text-red-700"
        }`}>
          <Info className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{state.message}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="sticky bottom-8">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UserCheck className="w-5 h-5 text-blue-100 group-hover:scale-110 transition-transform" />
              Lưu điểm danh buổi học
            </>
          )}
        </button>
      </div>
    </form>
  );
}
