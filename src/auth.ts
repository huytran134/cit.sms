import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SystemRole } from "@prisma/client";
import { authConfig } from "./auth.config";
import type { DefaultSession } from "next-auth";

// Module augmentation — thêm id và roles vào session/JWT
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: SystemRole[];
      fullName: string;
    } & DefaultSession["user"];
  }

  interface User {
    roles: SystemRole[];
    fullName: string;
  }
}

// next-auth v5 beta: JWT augmentation moved into main module
declare module "next-auth" {
  interface JWT {
    id?: string;
    roles?: SystemRole[];
    fullName?: string;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Tìm user trong DB kèm roles
        const user = await prisma.user.findUnique({
          where: { email },
          include: { systemRoles: true },
        });

        if (!user) return null;

        // 2. Kiểm tra tài khoản có bị khóa không (rule Task này)
        if (!user.isActive) return null;

        // 3. So sánh mật khẩu với bcrypt
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // 4. Map roles từ junction table
        const roles = user.systemRoles.map((r) => r.roleId);

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          fullName: user.fullName,
          roles,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.fullName = user.fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as SystemRole[]) ?? [];
        session.user.fullName = token.fullName as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
