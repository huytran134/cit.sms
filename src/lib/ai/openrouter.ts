import OpenAI from "openai";
import { SystemRole, DebtStatus, ReceiptStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const OPENROUTER_MODEL = "google/gemini-3.1-flash-lite";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const openrouter = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://sms.citedu.vn",
    "X-Title": "CiT-SMS",
  },
});

// Phân tầng quyền hạn AI
export type AiUserTier = "ADMIN" | "RESTRICTED";

export function getUserTier(roles: SystemRole[]): AiUserTier {
  if (roles.includes(SystemRole.ADMIN)) return "ADMIN";
  return "RESTRICTED";
}

// Hệ thống instruction cho từng tier
export function buildSystemInstruction(tier: AiUserTier): string {
  if (tier === "ADMIN") {
    return `Bạn là trợ lý AI của hệ thống CiT-SMS (Trung tâm đào tạo CiT EDU JSC).
Bạn có quyền truy cập đầy đủ vào dữ liệu hệ thống bao gồm: học viên, tài chính, điểm danh, lớp học.
Khi trả lời về tài chính hoặc học viên, hãy sử dụng dữ liệu thực tế từ context được cung cấp.
QUAN TRỌNG: KHÔNG bao giờ đề cập CCCD, số điện thoại đầy đủ, hay địa chỉ cụ thể của học viên trong câu trả lời.
Khi nhắc đến học viên nhạy cảm, chỉ dùng "Học viên A", "Mã HV" hoặc tên họ (không kèm thông tin nhận dạng).
Trả lời bằng Tiếng Việt, ngắn gọn và chuyên nghiệp.`;
  }

  return `Bạn là trợ lý AI của hệ thống CiT-SMS (Trung tâm đào tạo CiT EDU JSC).
Bạn CHỈ được trả lời các câu hỏi về nội dung bài giảng, tài liệu học tập và quy định của trung tâm.
TUYỆT ĐỐI KHÔNG trả lời bất kỳ câu hỏi nào liên quan đến:
- Thông tin tài chính (học phí, công nợ, phiếu thu)
- Thông tin cá nhân học viên (họ tên cụ thể, CCCD, SĐT, địa chỉ)
- Danh sách học viên hoặc dữ liệu lớp học
Nếu được hỏi về các chủ đề trên, hãy từ chối lịch sự: "Tôi không có quyền truy cập thông tin tài chính hoặc dữ liệu học viên."
Trả lời bằng Tiếng Việt, ngắn gọn và chuyên nghiệp.`;
}

// Context Builder cho ADMIN — tóm tắt dữ liệu từ DB
export async function buildAdminContext(): Promise<string> {
  try {
    const [revenueResult, badDebtCount, pendingApprovals, totalStudying, activeClasses] =
      await Promise.all([
        prisma.paymentReceipt.aggregate({
          where: { status: ReceiptStatus.CONFIRMED },
          _sum: { amount: true },
        }),
        prisma.classMember.count({ where: { debtStatus: DebtStatus.BAD_DEBT } }),
        prisma.paymentReceipt.count({ where: { status: ReceiptStatus.PENDING_APPROVAL } }),
        prisma.student.count(),
        prisma.class.count(),
      ]);

    const totalRevenue = revenueResult._sum.amount ?? 0;

    return `=== DỮ LIỆU HỆ THỐNG (cập nhật tự động) ===
- Tổng doanh thu đã xác nhận: ${totalRevenue.toLocaleString("vi-VN")} VNĐ
- Số học viên công nợ xấu: ${badDebtCount} trường hợp
- Phiếu thu chờ duyệt: ${pendingApprovals} phiếu
- Tổng học viên trong hệ thống: ${totalStudying}
- Tổng lớp học: ${activeClasses}
=== HẾT DỮ LIỆU HỆ THỐNG ===`;
  } catch {
    return "";
  }
}

// Context Builder cho RESTRICTED — chỉ lấy tên file Document
export async function buildRestrictedContext(query: string): Promise<string> {
  try {
    const docs = await prisma.document.findMany({
      select: { fileName: true, category: true, fileUrl: true },
      take: 10,
    });

    if (docs.length === 0) return "";

    const docList = docs
      .map((d) => `- [${d.category.toUpperCase()}] ${d.fileName}: ${d.fileUrl}`)
      .join("\n");

    return `=== TÀI LIỆU HỌC TẬP CÓ SẴN ===
${docList}
=== HẾT DANH SÁCH TÀI LIỆU ===`;
  } catch {
    return "";
  }
}

// Đếm từ xấp xỉ để kiểm soát token
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Cắt bớt lịch sử nếu tổng context vượt 6000 từ (Rule 7 OOM Prevention)
export function truncateHistory(
  history: { role: string; content: string }[],
  systemWords: number,
  maxTotal = 6000
): { role: string; content: string }[] {
  const budget = maxTotal - systemWords;
  let used = 0;
  const result: typeof history = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const w = countWords(history[i].content);
    if (used + w > budget) break;
    used += w;
    result.unshift(history[i]);
  }

  return result;
}
