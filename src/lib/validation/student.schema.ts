import { z } from "zod";

/**
 * Regex for Vietnamese phone numbers: Starts with 0, followed by 9 digits.
 */
const VIETNAMESE_PHONE_REGEX = /^0\d{9}$/;

/**
 * Regex for CCCD/CMND: 9 digits (old) or 12 digits (new).
 */
const CCCD_REGEX = /^[0-9]{9}$|^[0-9]{12}$/;

export const createStudentSchema = z
  .object({
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
      .or(z.literal("")),
      
    gender: z.string().optional(),
    
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải theo định dạng YYYY-MM-DD")
      .optional()
      .or(z.literal("")),

    cccdNumber: z
      .string()
      .regex(CCCD_REGEX, "Số CCCD không hợp lệ (9 hoặc 12 chữ số)")
      .optional()
      .or(z.literal("")),

    consentCccd: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If cccdNumber is provided, consentCccd must be true
      if (data.cccdNumber && data.cccdNumber.trim() !== "") {
        return data.consentCccd === true;
      }
      return true;
    },
    {
      message: "Bạn phải đồng ý lưu trữ CCCD để tiếp tục",
      path: ["consentCccd"],
    }
  );

export type CreateStudentInput = z.output<typeof createStudentSchema>;
