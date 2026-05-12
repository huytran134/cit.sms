import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  geminiModel,
  getUserTier,
  buildSystemInstruction,
  buildAdminContext,
  buildRestrictedContext,
  countWords,
  truncateHistory,
} from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const userId = session.user.id as string;
  const userRoles = session.user.roles;
  const tier = getUserTier(userRoles);

  // OOM Prevention Rule 7: lấy tối đa 20 tin nhắn gần nhất
  const rawHistory = await prisma.aiChatHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { role: true, content: true },
  });
  const chatHistory = rawHistory.reverse();

  // Xây dựng context theo tier
  const systemInstruction = buildSystemInstruction(tier);
  const dbContext =
    tier === "ADMIN"
      ? await buildAdminContext()
      : await buildRestrictedContext(message);

  const systemBlock = `${systemInstruction}\n\n${dbContext}`.trim();
  const systemWords = countWords(systemBlock);

  // Cắt lịch sử nếu vượt 6000 từ (Rule 7 / Truncate Context)
  const trimmedHistory = truncateHistory(chatHistory, systemWords);

  // Chuyển history sang format Gemini
  const geminiHistory = trimmedHistory.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));

  // Lưu câu hỏi user vào DB trước khi gửi Gemini
  await prisma.aiChatHistory.create({
    data: { userId, role: "user", content: message.trim() },
  });

  // Khởi tạo chat session với history
  const chat = geminiModel.startChat({
    systemInstruction: systemBlock,
    history: geminiHistory,
  });

  // Tạo ReadableStream để streaming SSE về client
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await chat.sendMessageStream(message.trim());

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }

        // Lưu câu trả lời AI vào DB sau khi stream xong
        await prisma.aiChatHistory.create({
          data: { userId, role: "assistant", content: fullResponse },
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Gemini stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Trợ lý AI đang bận, vui lòng thử lại sau vài giây" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
