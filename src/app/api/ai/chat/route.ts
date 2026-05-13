import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import type OpenAI from "openai";
import {
  openrouter,
  OPENROUTER_MODEL,
  getUserTier,
  buildSystemInstruction,
  buildAdminContext,
  buildRestrictedContext,
  countWords,
  truncateHistory,
} from "@/lib/ai/openrouter";

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

  // Xây dựng context theo tier (ADMIN → DB data, RESTRICTED → Document only)
  const systemInstruction = buildSystemInstruction(tier);
  const dbContext =
    tier === "ADMIN"
      ? await buildAdminContext()
      : await buildRestrictedContext(message);

  const systemBlock = `${systemInstruction}\n\n${dbContext}`.trim();
  const systemWords = countWords(systemBlock);

  // Cắt lịch sử nếu vượt 6000 từ (Rule 7 / Truncate Context)
  const trimmedHistory = truncateHistory(chatHistory, systemWords);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemBlock },
    ...trimmedHistory.map((h) => ({
      role: (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: h.content,
    })),
    { role: "user", content: message.trim() },
  ];

  // Lưu câu hỏi user vào DB trước khi gọi AI
  await prisma.aiChatHistory.create({
    data: { userId, role: "user", content: message.trim() },
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiStream = await openrouter.chat.completions.create({
          model: OPENROUTER_MODEL,
          stream: true,
          messages,
        });

        for await (const chunk of aiStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // Lưu câu trả lời AI sau khi stream kết thúc
        await prisma.aiChatHistory.create({
          data: { userId, role: "assistant", content: fullResponse },
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("[AI_CHAT] Stream error:", error);
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
