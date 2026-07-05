import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { masterLoginSchema, webCustomerLoginSchema, adminLoginSchema } from "@/lib/validations"
import { validateInitDataAny, telegramDisplayName } from "@/lib/telegram-initdata"

export type AuthUser = {
  id: string
  email: string
  name: string
  isVerified: boolean
  role: "MASTER" | "CUSTOMER" | "ADMIN"
}

function normalizePhone(phone: string) {
  return phone.startsWith("+") ? phone : `+${phone}`
}

export async function validateMasterCredentials(
  phone: string,
  password: string
): Promise<AuthUser> {
  const parsed = masterLoginSchema.safeParse({ phone, password })
  if (!parsed.success) throw new Error("Noto'g'ri ma'lumotlar kiritildi")

  const normalizedPhone = normalizePhone(parsed.data.phone)

  const master = await prisma.master.findUnique({
    where: { phone: normalizedPhone },
    select: { id: true, email: true, fullName: true, isVerified: true, isActive: true, password: true },
  })

  if (!master) throw new Error("Telefon raqam yoki parol noto'g'ri")
  if (!master.isActive) throw new Error("Akkauntingiz bloklangan. Administrator bilan bog'laning")
  // Telegram-onboarded masters have no password — they must use the bot, not phone+password.
  if (!master.password) throw new Error("Bu akkaunt Telegram orqali kiradi")

  const ok = await bcryptjs.compare(password, master.password)
  if (!ok) throw new Error("Telefon raqam yoki parol noto'g'ri")

  return {
    id: master.id,
    email: master.email,
    name: master.fullName,
    isVerified: master.isVerified,
    role: "MASTER",
  }
}

export async function validateCustomerCredentials(
  phone: string,
  password: string
): Promise<AuthUser> {
  const parsed = webCustomerLoginSchema.safeParse({ phone, password })
  if (!parsed.success) throw new Error("Noto'g'ri ma'lumotlar kiritildi")

  const normalizedPhone = normalizePhone(parsed.data.phone)

  const customer = await prisma.webCustomer.findUnique({
    where: { phone: normalizedPhone },
    select: { id: true, fullName: true, password: true },
  })
  if (!customer) throw new Error("Telefon raqam yoki parol noto'g'ri")
  if (!customer.password) throw new Error("Bu akkaunt Telegram orqali kiradi")

  const ok = await bcryptjs.compare(password, customer.password)
  if (!ok) throw new Error("Telefon raqam yoki parol noto'g'ri")

  return {
    id: customer.id,
    email: `customer-${customer.id}@ustatanla.local`,
    name: customer.fullName,
    isVerified: true,
    role: "CUSTOMER",
  }
}

/**
 * Telegram Mini App / web-in-Telegram sign-in. Validates initData against the
 * bot tokens and auto-creates a WebCustomer by telegramId — so opening the app
 * inside Telegram gives a real account instead of a guest.
 */
export async function validateTelegramWebApp(initData: string): Promise<AuthUser | null> {
  if (!initData) return null
  const v = validateInitDataAny(initData, [process.env.USTA_BOT_TOKEN, process.env.MIJOZ_BOT_TOKEN])
  if (!v) return null

  const tgId = String(v.user.id)
  let customer = await prisma.webCustomer.findUnique({
    where: { telegramId: tgId },
    select: { id: true, fullName: true },
  })
  if (!customer) {
    customer = await prisma.webCustomer.create({
      data: { telegramId: tgId, fullName: telegramDisplayName(v.user) },
      select: { id: true, fullName: true },
    })
  }
  return {
    id: customer.id,
    email: `customer-${customer.id}@ustatanla.local`,
    name: customer.fullName,
    isVerified: true,
    role: "CUSTOMER",
  }
}

export async function validateAdminCredentials(
  email: string,
  password: string
): Promise<AuthUser> {
  const parsed = adminLoginSchema.safeParse({ email, password })
  if (!parsed.success) throw new Error("Noto'g'ri ma'lumotlar kiritildi")

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
    select: { id: true, email: true, name: true, password: true },
  })

  if (!admin) throw new Error("Email yoki parol noto'g'ri")

  const ok = await bcryptjs.compare(password, admin.password)
  if (!ok) throw new Error("Email yoki parol noto'g'ri")

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    isVerified: true,
    role: "ADMIN",
  }
}
