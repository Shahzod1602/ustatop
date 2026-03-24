import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTelegramSessionFromCookies } from "@/lib/telegram-session"
import { customerProfileSchema } from "@/lib/validations"

export async function GET() {
  try {
    const tg = await getTelegramSessionFromCookies()
    if (!tg?.telegramId) {
      return NextResponse.json({ error: "Telegram session topilmadi" }, { status: 401 })
    }

    const [profile, linkedMaster] = await Promise.all([
      prisma.customerProfile.findUnique({
        where: { telegramId: tg.telegramId },
      }),
      prisma.master.findFirst({
        where: { telegramId: tg.telegramId },
        select: { id: true, fullName: true, phone: true },
      }),
    ])

    const resolvedProfile = profile
      ? {
          ...profile,
          isMaster: profile.isMaster || !!linkedMaster,
        }
      : {
          telegramId: tg.telegramId,
          fullName: linkedMaster?.fullName ?? tg.firstName ?? "",
          phone: linkedMaster?.phone ?? "",
          city: "Toshkent",
          isMaster: !!linkedMaster,
        }

    return NextResponse.json({ profile: resolvedProfile })
  } catch (err) {
    console.error("[GET /api/profile]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tg = await getTelegramSessionFromCookies()
    if (!tg?.telegramId) {
      return NextResponse.json({ error: "Telegram session topilmadi" }, { status: 401 })
    }

    const linkedMaster = await prisma.master.findFirst({
      where: { telegramId: tg.telegramId },
      select: { id: true },
    })

    const body = await req.json()
    const parsed = customerProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const fullName = parsed.data.fullName.trim()
    const phone = parsed.data.phone?.trim() || null
    const city = parsed.data.city?.trim() || "Toshkent"

    const profile = await prisma.customerProfile.upsert({
      where: { telegramId: tg.telegramId },
      update: { fullName, phone, city },
      create: {
        telegramId: tg.telegramId,
        fullName,
        phone,
        city,
        isMaster: !!linkedMaster,
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (err) {
    console.error("[POST /api/profile]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
