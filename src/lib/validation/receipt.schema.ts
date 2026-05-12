import { z } from "zod";

/**
 * Validation schema for creating payment receipts.
 * Task 4.1
 */

export const createReceiptSchema = z
  .object({
    classMemberId: z.string().min(1, "Vui lòng chọn học viên"),
    amount: z.coerce.number().min(1000, "Số tiền tối thiểu là 1.000đ"),
    paymentMethod: z.enum(["CASH", "TRANSFER"], {
      message: "Vui lòng chọn hình thức thanh toán",
    }),
    // CHỈ SỬA 3 DÒNG NÀY: Bỏ .or(z.literal("")) đi
    senderName: z.string().nullable().optional(),
    senderBankAccount: z.string().nullable().optional(),
    senderNote: z.string().nullable().optional(),
    paymentDate: z
      .string()
      .min(1, "Vui lòng chọn ngày thu")
      .default(() => new Date().toISOString().split("T")[0]),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "TRANSFER") {
      if (!data.senderName || data.senderName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tên người chuyển khoản là bắt buộc khi chọn Chuyển khoản",
          path: ["senderName"],
        });
      }
      if (!data.senderBankAccount || data.senderBankAccount.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Số tài khoản/Ngân hàng là bắt buộc khi chọn Chuyển khoản",
          path: ["senderBankAccount"],
        });
      }
    }
  });

export type CreateReceiptInput = z.output<typeof createReceiptSchema>;