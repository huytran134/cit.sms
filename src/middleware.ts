import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Dùng edge-safe config (không có Prisma) để middleware chạy trên Edge runtime
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Bảo vệ tất cả route trừ static files, api/auth (NextAuth handler), favicon
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
