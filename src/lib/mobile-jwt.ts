import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-secret")

export interface MobileTokenPayload {
  sub: string // user id
  name: string
  role: "MASTER" | "CUSTOMER" | "ADMIN"
  isVerified: boolean
}

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (!payload.sub || !payload.role) return null
    return {
      sub: payload.sub as string,
      name: (payload.name as string) ?? "",
      role: payload.role as MobileTokenPayload["role"],
      isVerified: (payload.isVerified as boolean) ?? false,
    }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.type !== "refresh" || !payload.sub) return null
    return payload.sub as string
  } catch {
    return null
  }
}
