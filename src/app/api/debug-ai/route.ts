import { NextResponse } from "next/server";
import { OPENROUTER_BASE_URL, OPENROUTER_MODEL } from "@/lib/ai/gemini";

export async function GET() {
  // Step 1: Check API key presence
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      step: "env_check",
      error: "OPENROUTER_API_KEY is not set (undefined or empty)",
    });
  }

  // Step 2: Try a minimal OpenRouter call
  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: "Xin chào" }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        step: "openrouter_call",
        status: res.status,
        error: data?.error?.message ?? JSON.stringify(data),
        keyPrefix: `${apiKey.slice(0, 10)}…`,
      });
    }

    const text: string = data.choices?.[0]?.message?.content ?? "(no content)";
    return NextResponse.json({
      ok: true,
      step: "openrouter_call",
      model: OPENROUTER_MODEL,
      response: text.slice(0, 200),
      keyPrefix: `${apiKey.slice(0, 10)}…`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      step: "openrouter_call",
      error: message,
      keyPrefix: `${apiKey.slice(0, 10)}…`,
    });
  }
}
