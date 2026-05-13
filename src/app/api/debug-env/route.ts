import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "(not set)";
  // Mask password but show enough to diagnose
  const masked = url.replace(/:([^:@]+)@/, ":<PASS_LEN=" + (url.match(/:([^:@]+)@/)?.[1]?.length ?? 0) + ">@");
  return NextResponse.json({
    DATABASE_URL_masked: masked,
    NODE_ENV: process.env.NODE_ENV,
    has_value: url !== "(not set)",
  });
}
