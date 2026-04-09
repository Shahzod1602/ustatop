import { NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { masterRegisterSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = masterRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { fullName, phone, password, serviceArea, categories, bio, pricing } = parsed.data
    const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`

    // Check uniqueness by phone
    const existingPhone = await prisma.master.findUnique({ where: { phone: normalizedPhone } })
    if (existingPhone) {
      return NextResponse.json({ error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" }, { status: 409 })
    }

    const syntheticEmail = `ph-${normalizedPhone.replace(/\D/g, "")}@ustatop.local`
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create master with categories
    const master = await prisma.master.create({
      data: {
        fullName,
        email: syntheticEmail,
        password: hashedPassword,
        phone: normalizedPhone,
        serviceArea,
        bio: bio ?? null,
        isVerified: false,
        isActive: true,
        categories: {
          create: categories.map((categoryId) => ({ categoryId })),
        },
      },
    })

    // Store pricing in bio field as extra context (simple approach for MVP)
    if (pricing) {
      await prisma.master.update({
        where: { id: master.id },
        data: { bio: bio ? `${bio}\n\nNarxlar: ${pricing}` : `Narxlar: ${pricing}` },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Muvaffaqiyatli ro'yxatdan o'tdingiz! Tizimga kiring.",
      masterId: master.id,
    })
  } catch (err) {
    console.error("[POST /api/auth/register]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
