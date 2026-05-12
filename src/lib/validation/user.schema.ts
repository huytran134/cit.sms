import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự").max(100),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/\d/, "Mật khẩu phải có ít nhất 1 chữ số"),
  role: z.enum(["CLASS_LEADER", "TEACHER"]).refine((v) => v !== undefined, {
    message: "Chức vụ không hợp lệ",
  }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateUserInfoSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự").max(100),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số"),
  newPassword: z
    .string()
    .optional()
    .refine(
      (v) => !v || (v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v)),
      "Mật khẩu mới phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số"
    ),
});

export type UpdateUserInfoInput = z.infer<typeof updateUserInfoSchema>;
