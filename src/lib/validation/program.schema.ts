import { z } from "zod";

/**
 * Validation schema for creating academic programs.
 * Follows Task 2.1 requirements.
 */
export const createProgramSchema = z.object({
  code: z
    .string()
    .regex(/^[A-Z]{2,6}$/, "Mã chương trình phải từ 2-6 ký tự in hoa (VD: TDTN)"),
  
  name: z
    .string()
    .min(2, "Tên chương trình tối thiểu 2 ký tự")
    .max(100, "Tên chương trình tối đa 100 ký tự"),
  
  branch: z.enum(["thinking", "skill", "mentoring"], {
    message: "Vui lòng chọn nhánh chương trình",
  }),

  feeCycle: z.enum(["COURSE", "HALF_YEAR", "YEAR"], {
    message: "Vui lòng chọn chu kỳ thu phí",
  }),

  type: z.enum(["REGULAR", "MENTORING"], {
    message: "Vui lòng chọn loại chương trình",
  }),
  
  tuitionFee: z.coerce
    .number({ message: "Học phí phải là một số" })
    .min(0, "Học phí không được âm"),
  
  description: z.string().optional().or(z.literal("")),
});

export type CreateProgramInput = z.output<typeof createProgramSchema>;
