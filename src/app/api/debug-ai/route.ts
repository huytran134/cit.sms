import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  // Step 1: Check API key presence
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      step: "env_check",
      error: "GEMINI_API_KEY is not set (undefined or empty)",
    });
  }

  // Step 2: Try a minimal Gemini call
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Xin chào");
    const text = result.response.text();

    return NextResponse.json({
      ok: true,
      step: "gemini_call",
      response: text.slice(0, 200),
      keyPrefix: `${apiKey.slice(0, 8)}…`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 5).join(" | ") : undefined;

    return NextResponse.json({
      ok: false,
      step: "gemini_call",
      error: message,
      stack,
      keyPrefix: `${apiKey.slice(0, 8)}…`,
    });
  }
}
