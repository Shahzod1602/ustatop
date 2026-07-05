import { SignJWT, jwtVerify } from "jose"

// Fail closed at RUNTIME (not import time): resolve the key lazily so that
// `next build` — which imports these modules without runtime env — doesn't throw.
// If the secret is missing/weak when a token is actually signed or verified, throw.
let cachedKey: Uint8Array | null = null
function getSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey
  const rawSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!rawSecret || rawSecret.length < 16) {
    throw new Error(
      "NEXTAUTH_SECRET (yoki AUTH_SECRET) o'rnatilmagan yoki juda qisqa (kamida 16 belgi). Mobil JWT xavfsiz ishlay olmaydi."
    )
  }
  cachedKey = new TextEncoder().encode(rawSecret)
  return cachedKey
}

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
    .sign(getSecretKey())
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey())
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] })
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
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] })
    if (payload.type !== "refresh" || !payload.sub) return null
    return payload.sub as string
  } catch {
    return null
  }
}
