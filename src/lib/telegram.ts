import crypto from "crypto"

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface ParsedInitData {
  user?: TelegramUser
  auth_date?: number
  query_id?: string
}

export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSec = 86400): ParsedInitData | null {
  if (!initData || !botToken) return null

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) return null

  const pairs: string[] = []
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue
    pairs.push(`${key}=${value}`)
  }
  pairs.sort()
  const dataCheckString = pairs.join("\n")

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const expected = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")
  if (expected !== hash) return null

  const authDateRaw = params.get("auth_date")
  const authDate = authDateRaw ? Number(authDateRaw) : undefined
  if (!authDate || Number.isNaN(authDate)) return null

  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > maxAgeSec) return null

  const userRaw = params.get("user")
  const user = userRaw ? (JSON.parse(userRaw) as TelegramUser) : undefined

  return {
    user,
    auth_date: authDate,
    query_id: params.get("query_id") ?? undefined,
  }
}
