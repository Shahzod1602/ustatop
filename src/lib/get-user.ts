import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { verifyMobileToken } from "@/lib/mobile-jwt"
import { prisma } from "@/lib/prisma"

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

  // Re-check against the DB on every request so blocked/deleted users lose access
  // immediately instead of the token staying valid for its full 7-day lifetime.
  if (payload.role === "MASTER") {
    const master = await prisma.master.findUnique({
      where: { id: payload.sub },
      select: { id: true, fullName: true, isActive: true, isVerified: true },
    })
    if (!master || !master.isActive) return null
    return { id: master.id, name: master.fullName, role: "MASTER", isVerified: master.isVerified }
  }

  if (payload.role === "CUSTOMER") {
    const customer = await prisma.webCustomer.findUnique({
      where: { id: payload.sub },
      select: { id: true, fullName: true },
    })
    if (!customer) return null
    return { id: customer.id, name: customer.fullName, role: "CUSTOMER", isVerified: true }
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true },
  })
  if (!admin) return null
  return { id: admin.id, name: admin.name, role: "ADMIN", isVerified: true }
}
