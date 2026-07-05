// Load .env (Prisma loads it for its CLI, but a plain tsx script needs this).
try {
  // Node 20.12+ / 22+ built-in — no dotenv dependency needed.
  ;(process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(".env")
} catch {
  // .env is optional if the vars are already in the environment.
}

export const USTA_BOT_TOKEN = process.env.USTA_BOT_TOKEN ?? ""
export const MIJOZ_BOT_TOKEN = process.env.MIJOZ_BOT_TOKEN ?? ""

// Public HTTPS URL where the Mini App (Next.js /tma) is served — used for masters.
export const MINIAPP_URL = process.env.MINIAPP_URL ?? "https://ustatanla.uz/tma"

// Customers open the original web catalog design (warm UstaTop pages).
const BASE = MINIAPP_URL.replace(/\/tma\/?$/, "")
export const USER_APP_URL = process.env.USER_APP_URL ?? `${BASE}/ustalar`

export const DEFAULT_CITY = "Toshkent"

export const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg'ona",
  "Namangan",
  "Qashqadaryo",
  "Nukus",
]

export const PRICE_RANGES = [
  "50 000 – 150 000 so'm",
  "150 000 – 500 000 so'm",
  "500 000+ so'm",
  "Kelishilgan",
]
