import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import {
  OPENROUTER_MODEL,
  OPENROUTER_BASE_URL,
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

  // Chuyển history sang format OpenAI messages
  const messages = [
    { role: "system", content: systemBlock },
    ...trimmedHistory.map((h) => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    })),
    { role: "user", content: message.trim() },
  ];

  // Lưu câu hỏi user vào DB trước khi gửi
  await prisma.aiChatHistory.create({
    data: { userId, role: "user", content: message.trim() },
  });

  // Tạo ReadableStream SSE về client
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: OPENROUTER_MODEL, messages, stream: true }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text();
          throw new Error(`OpenRouter ${res.status}: ${errText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const raw = trimmed.slice(6);
            if (raw === "[DONE]") continue;

            try {
              const json = JSON.parse(raw);
              const text: string = json.choices?.[0]?.delta?.content ?? "";
              if (text) {
                fullResponse += text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // bỏ qua chunk parse lỗi
            }
          }
        }

        // Lưu câu trả lời AI sau khi stream xong
        await prisma.aiChatHistory.create({
          data: { userId, role: "assistant", content: fullResponse },
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("OpenRouter stream error:", error);
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
