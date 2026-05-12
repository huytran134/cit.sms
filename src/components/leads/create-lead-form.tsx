"use client";

import React, { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLeadSchema, CreateLeadInput } from "@/lib/validation/lead.schema";
import { createLeadAction } from "@/lib/actions/lead";
import { User, Phone, Mail, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function CreateLeadForm() {
  const [state, action, isPending] = useActionState(createLeadAction, null);

  const {
    register,
    formState: { errors },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { fullName: "", phone: "", email: "", source: "" },
  });

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-5">
        <form action={action} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("fullName")}
              id="fullName"
              name="fullName"
              placeholder="Nguyễn Văn A"
              className={errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-destructive text-xs">{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              Số điện thoại <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("phone")}
              id="phone"
              name="phone"
              placeholder="0912345678"
              className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-destructive text-xs">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              Email
            </Label>
            <Input
              {...register("email")}
              id="email"
              name="email"
              type="email"
              placeholder="example@gmail.com"
              className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source" className="flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
              Nguồn khách hàng
            </Label>
            <Input
              {...register("source")}
              id="source"
              name="source"
              placeholder="Facebook, Giới thiệu..."
            />
          </div>

          {state && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              state.success
                ? "bg-accent/10 border border-accent/20 text-accent"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}>
              {state.message}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isPending ? "Đang xử lý..." : "Tạo khách hàng mới"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
