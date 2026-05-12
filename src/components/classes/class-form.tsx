"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClassSchema, CreateClassInput } from "@/lib/validation/class.schema";
import { createClassAction, fetchBranchesAction } from "@/lib/actions/class";
import { fetchProgramsAction } from "@/lib/actions/program";
import {
  GraduationCap, Globe, Users, Calendar, Loader2, Info, Sparkles, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ClassForm() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [state, action, isPending] = useActionState(createClassAction, null);

  const {
    register,
    watch,
    reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema) as any,
    defaultValues: {
      programId: "",
      branchId: "",
      format: "OFFLINE",
      capacityMax: undefined,
      scheduleType: "fixed",
      startDate: "",
    },
  });

  const selectedProgramId = watch("programId");
  const selectedFormat = watch("format");
  const startDateValue = watch("startDate");

  useEffect(() => {
    async function loadData() {
      try {
        const [programData, branchData] = await Promise.all([
          fetchProgramsAction(),
          fetchBranchesAction(),
        ]);
        setPrograms(programData);
        setBranches(branchData);
      } catch (error) {
        console.error("Failed to load form data", error);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (state?.success) reset();
  }, [state, reset]);

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const previewYear = startDateValue
    ? new Date(startDateValue).getFullYear()
    : new Date().getFullYear();

  function getPreviewCode(program: any): string {
    if (!program) return "—";
    if (program.type === "MENTORING") return `${program.code}_${previewYear}.N`;
    const yearCode = String(previewYear - 2009).padStart(2, "0");
    return `${program.code}_${yearCode}.N`;
  }

  const selectClass = "w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-ring/20 focus:border-ring disabled:opacity-50";

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-5">
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Program Selection */}
            <div className="space-y-2">
              <Label htmlFor="programId" className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                Chọn chương trình <span className="text-destructive">*</span>
              </Label>
              <select
                {...register("programId")}
                id="programId"
                name="programId"
                disabled={loadingData}
                className={`${selectClass} ${errors.programId ? "border-destructive" : ""}`}
              >
                <option value="">{loadingData ? "Đang tải..." : "--- Chọn chương trình ---"}</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
              {selectedProgram && (
                <div className="flex items-center gap-1.5 px-1 animate-in fade-in duration-200">
                  <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                  <p className="text-[11px] text-muted-foreground italic">
                    Mã dự kiến: <span className="text-primary font-bold">{getPreviewCode(selectedProgram)}</span>
                    {" — "}Học phí: <span className="font-bold text-foreground">{selectedProgram.tuitionFee.toLocaleString("vi-VN")}đ</span>
                  </p>
                </div>
              )}
              {errors.programId && <p className="text-destructive text-xs">{errors.programId.message}</p>}
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branchId" className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Cơ sở <span className="text-destructive">*</span>
              </Label>
              <select
                {...register("branchId")}
                id="branchId"
                name="branchId"
                disabled={loadingData}
                className={`${selectClass} ${errors.branchId ? "border-destructive" : ""}`}
              >
                <option value="">{loadingData ? "Đang tải..." : "--- Chọn cơ sở ---"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.branchId && <p className="text-destructive text-xs">{errors.branchId.message}</p>}
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label htmlFor="format" className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Hình thức học <span className="text-destructive">*</span>
              </Label>
              <select {...register("format")} id="format" name="format" className={selectClass}>
                <option value="OFFLINE">Trực tiếp (Offline)</option>
                <option value="ONLINE">Trực tuyến (Online)</option>
              </select>
            </div>

            {/* Schedule Type */}
            <div className="space-y-2">
              <Label htmlFor="scheduleType" className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Loại lịch học <span className="text-destructive">*</span>
              </Label>
              <select {...register("scheduleType")} id="scheduleType" name="scheduleType" className={selectClass}>
                <option value="fixed">Lịch cố định</option>
                <option value="flexible">Lịch linh hoạt</option>
              </select>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacityMax" className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Sĩ số tối đa
              </Label>
              <Input
                {...register("capacityMax")}
                id="capacityMax"
                name="capacityMax"
                type="number"
                placeholder={selectedFormat === "OFFLINE" ? "Mặc định: 30" : "Mặc định: 500"}
                className={errors.capacityMax ? "border-destructive" : ""}
              />
              {errors.capacityMax && <p className="text-destructive text-xs">{errors.capacityMax.message}</p>}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Ngày khai giảng dự kiến
              </Label>
              <Input {...register("startDate")} id="startDate" name="startDate" type="date" />
              <p className="text-[11px] text-muted-foreground">Dùng để tính YearCode trong mã lớp.</p>
            </div>
          </div>

          {state && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${
              state.success
                ? "bg-accent/10 border-accent/20 text-accent"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{state.message}</p>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isPending ? "Đang khởi tạo lớp học..." : "Xác nhận mở lớp"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
