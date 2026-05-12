"use client";

import React, { useState, useTransition } from "react";
import { generateClassSessions } from "@/lib/actions/session";
import { CalendarPlus, Loader2, Info } from "lucide-react";

interface GenerateSessionsButtonProps {
  classId: string;
}

const DAYS_OF_WEEK = [
  { label: "T2", value: 1 },
  { label: "T3", value: 2 },
  { label: "T4", value: 3 },
  { label: "T5", value: 4 },
  { label: "T6", value: 5 },
  { label: "T7", value: 6 },
  { label: "CN", value: 0 },
];

export function GenerateSessionsButton({ classId }: GenerateSessionsButtonProps) {
  // Mặc định: Thứ 3, 5, 7
  const [selectedDays, setSelectedDays] = useState<number[]>([2, 4, 6]);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const toggleDay = (value: number) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
    setResult(null);
  };

  const handleGenerate = () => {
    if (selectedDays.length === 0) {
      setResult({ success: false, message: "Vui lòng chọn ít nhất 1 ngày học trong tuần." });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await generateClassSessions(classId, selectedDays);
      setResult(res);
    });
  };

  return (
    <div className="bg-card p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Ngày học hàng tuần
          </p>
          <p className="text-xs text-slate-400">Chọn các ngày lớp học mỗi tuần</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`w-10 h-10 rounded-xl text-xs font-black transition-all border ${
                selectedDays.includes(day.value)
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                  : "bg-background text-slate-400 border-border hover:border-emerald-200 hover:text-emerald-600"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div
          className={`p-3 rounded-xl flex items-center gap-3 border ${
            result.success
              ? "bg-green-50 border-green-100 text-green-700"
              : "bg-red-50 border-red-100 text-red-700"
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <p className="text-xs font-medium">{result.message}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || selectedDays.length === 0}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CalendarPlus className="w-4 h-4" />
            Tạo lịch 3 tuần tới
          </>
        )}
      </button>
    </div>
  );
}
