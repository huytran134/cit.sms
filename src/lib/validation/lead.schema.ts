import { z } from "zod";

/**
 * Regex for Vietnamese phone numbers:
 * Starts with 0, followed by exactly 9 digits (total 10 digits).
 */
const VIETNAMESE_PHONE_REGEX = /^0\d{9}$/;

/**
 * Validation schema for creating a new Lead.
 * Follows the Lead table structure in Prisma and Phase 0 business rules.
 */
export const createLeadSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên tối đa 100 ký tự"),
  
  phone: z
    .string()
    .regex(VIETNAMESE_PHONE_REGEX, "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)"),
  
  email: z
    .string()
    .email("Email không hợp lệ")
    .optional()
    .or(z.literal("")), // Allows empty string as well as undefined
    
  source: z
    .string()
    .max(255, "Nguồn dữ liệu tối đa 255 ký tự")
    .optional()
    .or(z.literal("")),
});

/**
 * Type inferred from the Lead creation schema
 */
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
