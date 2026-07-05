import crypto from "crypto"

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface ValidatedInitData {
  user: TelegramUser
  authDate: number
  raw: URLSearchParams
}

/**
 * Validate a Telegram Mini App `initData` string against a bot token.
 *
 * Algorithm (per Telegram docs):
 *   secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
 *   hash       = HMAC_SHA256(key=secret_key, msg=data_check_string)   (hex)
 * where data_check_string is every field except `hash`, sorted, joined by "\n".
 *
 * Returns the parsed data only if the signature is valid AND the payload is
 * fresh (auth_date within maxAgeSeconds). Returns null otherwise — fail closed.
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 3_600
): ValidatedInitData | null {
  if (!initData || !botToken) return null

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) return null

  const pairs: string[] = []
  params.forEach((value, key) => {
    if (key !== "hash") pairs.push(`${key}=${value}`)
  })
  pairs.sort()
  const dataCheckString = pairs.join("\n")

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  // Constant-time comparison.
  let a: Buffer
  let b: Buffer
  try {
    a = Buffer.from(computed, "hex")
    b = Buffer.from(hash, "hex")
  } catch {
    return null
  }
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  const authDate = parseInt(params.get("auth_date") ?? "0", 10)
  if (!authDate) return null
  if (maxAgeSeconds > 0) {
    const nowSec = Math.floor(Date.now() / 1000)
    if (nowSec - authDate > maxAgeSeconds) return null
  }

  const userJson = params.get("user")
  if (!userJson) return null
  let user: TelegramUser
  try {
    user = JSON.parse(userJson)
  } catch {
    return null
  }
  if (!user?.id) return null

  return { user, authDate, raw: params }
}

/** Try multiple bot tokens (both bots open the same Mini App). */
export function validateInitDataAny(
  initData: string,
  tokens: (string | undefined)[],
  maxAgeSeconds = 3_600
): ValidatedInitData | null {
  for (const t of tokens) {
    if (!t) continue
    const res = validateInitData(initData, t, maxAgeSeconds)
    if (res) return res
  }
  return null
}

/** Convenience: human-readable display name from a Telegram user. */
export function telegramDisplayName(u: TelegramUser): string {
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || "Foydalanuvchi"
}
