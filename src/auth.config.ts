import type { NextAuthConfig } from "next-auth";

// Edge-safe config — KHÔNG dùng Prisma ở đây (Prisma không chạy được trên Edge runtime)
// File này chỉ dùng cho middleware để xác minh JWT token
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Phải có session callback ở đây để middleware đọc được roles từ JWT.
    // Nếu thiếu callback này, NextAuth sẽ dùng default session (không có roles).
    session({ session, token }) {
      if (token) {
        const user = session.user as unknown as Record<string, unknown>;
        user.id = token.id as string;
        user.roles = (token.roles as string[]) ?? [];
        user.fullName = token.fullName as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const roles = (auth?.user as { roles?: string[] })?.roles ?? [];
      const { pathname } = nextUrl;

      // /admin/* — chỉ ADMIN mới được vào
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        if (!roles.includes("ADMIN")) return Response.redirect(new URL("/staff/dashboard", nextUrl));
        return true;
      }

      // /staff/* — mọi user đã đăng nhập
      if (pathname.startsWith("/staff")) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        return true;
      }

      // /login khi đã đăng nhập -> redirect đúng trang theo role
      if (pathname.startsWith("/login") && isLoggedIn) {
        const dest = roles.includes("ADMIN") ? "/admin/dashboard" : "/staff/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }

      return true;
    },
  },
  providers: [], // Providers thật được khai báo trong src/auth.ts
} satisfies NextAuthConfig;
