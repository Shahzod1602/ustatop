import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user
  const role = (req.auth?.user as { role?: string } | undefined)?.role

  // ── Protect /dashboard/** — masters only ──
  if (nextUrl.pathname.startsWith("/dashboard")) {
    if (!isLoggedIn || role !== "MASTER") {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, req.url)
      )
    }
  }

  // ── Protect /admin/** (except /admin/login) ──
  if (nextUrl.pathname.startsWith("/admin") && nextUrl.pathname !== "/admin/login") {
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }
  }

  // ── Redirect already logged-in users away from auth pages ──
  if (nextUrl.pathname.startsWith("/auth/") && isLoggedIn) {
    if (role === "MASTER") return NextResponse.redirect(new URL("/dashboard", req.url))
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
