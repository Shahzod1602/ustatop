import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const TG_SESSION_COOKIE = "tg_session"

export interface TelegramSession {
  telegramId: string
  firstName?: string
  username?: string
}

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET is required")
  return new TextEncoder().encode(secret)
}

export async function createTelegramSessionToken(payload: TelegramSession) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function getTelegramSessionFromCookies() {
  const store = await cookies()
  const token = store.get(TG_SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const telegramId = payload.telegramId
    if (typeof telegramId !== "string") return null

    return {
      telegramId,
      firstName: typeof payload.firstName === "string" ? payload.firstName : undefined,
      username: typeof payload.username === "string" ? payload.username : undefined,
    } satisfies TelegramSession
  } catch {
    return null
  }
}
