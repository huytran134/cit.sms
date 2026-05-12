import { z } from "zod";

export const createClassSchema = z.object({
  programId: z.string().min(1, "Vui lòng chọn chương trình học"),

  branchId: z.string().min(1, "Vui lòng chọn cơ sở"),

  format: z.enum(["OFFLINE", "ONLINE"]),

  capacityMax: z.coerce.number({ error: "Sĩ số phải là một số" }).optional(),

  scheduleType: z.enum(["fixed", "flexible"]),

  // ISO date string (YYYY-MM-DD), optional — dùng để tính YearCode
  startDate: z.string().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
