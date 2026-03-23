/**
 * Lightweight auth config — safe for Edge Runtime (used in middleware).
 * Does NOT import Prisma or bcryptjs.
 */
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login", error: "/auth/error" },
  providers: [], // Providers added in auth.ts (Node.js runtime only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as { role?: string })?.role

      if (nextUrl.pathname.startsWith("/dashboard")) {
        return isLoggedIn && role === "MASTER"
      }
      if (
        nextUrl.pathname.startsWith("/admin") &&
        nextUrl.pathname !== "/admin/login"
      ) {
        return isLoggedIn && role === "ADMIN"
      }
      return true
    },
  },
}
