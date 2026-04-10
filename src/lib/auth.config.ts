/**
 * Lightweight auth config — safe for Edge Runtime (used in middleware).
 * Does NOT import Prisma or bcryptjs.
 * Role-based protection is handled entirely in middleware.ts
 */
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login", error: "/auth/error" },
  providers: [],
  callbacks: {
    // Always allow — middleware.ts handles role-based protection
    authorized() {
      return true
    },
  },
}
