import { z } from "zod";

export const publicFeedbackSchema = z.object({
  guestName: z.string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên quá dài"),
  guestPhone: z.string()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  lessonRating: z.coerce.number().min(1).max(5),
  teacherRating: z.coerce.number().min(1).max(5),
  taRating: z.coerce.number().min(1).max(5),
  comment: z.string().max(500, "Nội dung quá dài (tối đa 500 ký tự)").optional(),
});

export type PublicFeedbackInput = z.infer<typeof publicFeedbackSchema>;
