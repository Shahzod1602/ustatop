import { z } from "zod"

// ─── Master Auth ──────────────────────────────────────────────────────────────

export const masterLoginSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?998\d{9}$/, "Telefon raqam noto'g'ri (+998XXXXXXXXX)"),
})

export const masterRegisterSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta harfdan iborat bo'lishi kerak"),
  phone: z
    .string()
    .regex(/^\+?998\d{9}$/, "Telefon raqam noto'g'ri (+998XXXXXXXXX)"),
  serviceArea: z.string().min(2, "Xizmat hududini kiriting"),
  categories: z.array(z.string()).min(1, "Kamida bitta kategoriya tanlang"),
  bio: z.string().max(500, "Bio 500 belgidan oshmasligi kerak").optional(),
  pricing: z.string().max(200, "Narx ma'lumoti 200 belgidan oshmasligi kerak").optional(),
})

export type MasterRegisterInput = z.infer<typeof masterRegisterSchema>
export type MasterLoginInput = z.infer<typeof masterLoginSchema>

// ─── Service Request ──────────────────────────────────────────────────────────

export const serviceRequestSchema = z.object({
  customerName: z.string().min(2, "Ism kamida 2 ta harfdan iborat bo'lishi kerak").optional(),
  customerPhone: z
    .string()
    .regex(/^\+?998\d{9}$/, "Telefon raqam noto'g'ri (+998XXXXXXXXX)")
    .optional(),
  title: z.string().min(5, "Sarlavha kamida 5 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(20, "Tavsif kamida 20 ta belgidan iborat bo'lishi kerak"),
  categoryId: z.string().min(1, "Kategoriyani tanlang"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  address: z.string().min(5, "Manzilni kiriting"),
  city: z.string().min(2, "Shaharni tanlang"),
})

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>

// ─── Review ───────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  requestId: z.string().min(1),
  rating: z.number().int().min(1, "Reyting 1 dan kam bo'lmasligi kerak").max(5, "Reyting 5 dan oshmasligi kerak"),
  comment: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak").optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>

// ─── Master Profile Update ────────────────────────────────────────────────────

export const masterProfileSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta harfdan iborat bo'lishi kerak"),
  phone: z.string().regex(/^\+?998\d{9}$/, "Telefon raqam noto'g'ri"),
  bio: z.string().max(500).optional(),
  serviceArea: z.string().min(2, "Xizmat hududini kiriting"),
  pricing: z.string().max(200).optional(),
  profilePhoto: z.string().url().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
})

export type MasterProfileInput = z.infer<typeof masterProfileSchema>

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.string().email("Noto'g'ri email format"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
})

// ─── Telegram Customer Profile ───────────────────────────────────────────────

export const customerProfileSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta harf bo'lishi kerak"),
  phone: z
    .string()
    .regex(/^\+?998\d{9}$/, "Telefon raqam noto'g'ri (+998XXXXXXXXX)")
    .optional()
    .or(z.literal("")),
  city: z.string().min(2, "Shaharni kiriting").optional(),
})

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>

export const masterPostSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgi bo'lsin"),
  content: z.string().min(20, "Post matni kamida 20 ta belgi bo'lsin"),
  imageUrl: z.string().url("To'g'ri URL kiriting").optional().or(z.literal("")),
})

export type MasterPostInput = z.infer<typeof masterPostSchema>
