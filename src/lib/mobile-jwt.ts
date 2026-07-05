import { SignJWT, jwtVerify } from "jose"

// Fail closed: never fall back to a public constant. If the secret is missing or
// too weak, the app must not sign/verify tokens with a guessable key.
const rawSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
if (!rawSecret || rawSecret.length < 16) {
  throw new Error(
    "NEXTAUTH_SECRET (yoki AUTH_SECRET) o'rnatilmagan yoki juda qisqa (kamida 16 belgi). Mobil JWT xavfsiz ishlay olmaydi."
  )
}
const secret = new TextEncoder().encode(rawSecret)

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
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
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
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    if (payload.type !== "refresh" || !payload.sub) return null
    return payload.sub as string
  } catch {
    return null
  }
}
