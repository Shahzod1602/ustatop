import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { verifyMobileToken } from "@/lib/mobile-jwt"

export interface AppUser {
  id: string
  name: string
  email?: string
  role: "MASTER" | "CUSTOMER" | "ADMIN"
  isVerified: boolean
}

export async function getUser(): Promise<AppUser | null> {
  // 1. Try NextAuth session (web — cookie-based)
  const session = await auth()
  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? undefined,
      role: session.user.role,
      isVerified: session.user.isVerified ?? false,
    }
  }

  // 2. Try Bearer token (mobile — JWT-based)
  const headersList = await headers()
  const authorization = headersList.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null

  const token = authorization.slice(7)
  const payload = await verifyMobileToken(token)
  if (!payload) return null

  return {
    id: payload.sub,
    name: payload.name,
    role: payload.role,
    isVerified: payload.isVerified,
  }
}
