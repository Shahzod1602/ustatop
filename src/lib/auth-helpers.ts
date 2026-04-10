import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { masterLoginSchema, webCustomerLoginSchema, adminLoginSchema } from "@/lib/validations"

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

  const ok = await bcryptjs.compare(password, customer.password)
  if (!ok) throw new Error("Telefon raqam yoki parol noto'g'ri")

  return {
    id: customer.id,
    email: `customer-${customer.id}@ustatop.local`,
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
