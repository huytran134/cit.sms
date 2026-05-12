import { z } from "zod";

/**
 * Validation schema for creating class sessions.
 * Task 3.1
 */
export const createSessionSchema = z.object({
  sessionDate: z
    .string({ message: "Vui lòng chọn ngày học" })
    .min(1, "Vui lòng chọn ngày học"),
  
  topic: z
    .string()
    .max(255, "Nội dung bài học không quá 255 ký tự")
    .optional()
    .or(z.literal("")),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
