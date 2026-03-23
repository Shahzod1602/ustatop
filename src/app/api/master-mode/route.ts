import { NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getTelegramSessionFromCookies } from "@/lib/telegram-session"

function normalizePhone(phone: string) {
  return phone.startsWith("+") ? phone : `+${phone}`
}

export async function POST(req: NextRequest) {
  try {
    const tg = await getTelegramSessionFromCookies()
    if (!tg?.telegramId) {
      return NextResponse.json({ error: "Telegram session topilmadi" }, { status: 401 })
    }

    const profile = await prisma.customerProfile.findUnique({
      where: { telegramId: tg.telegramId },
    })

    if (!profile?.phone) {
      return NextResponse.json({ error: "Avval profilingizga telefon raqam qo'shing" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const serviceArea = typeof body?.serviceArea === "string" && body.serviceArea.trim() ? body.serviceArea.trim() : (profile.city ?? "Toshkent")

    const existingMasterByTg = await prisma.master.findFirst({
      where: { telegramId: tg.telegramId },
      select: { id: true },
    })
    if (existingMasterByTg) {
      await prisma.customerProfile.update({
        where: { telegramId: tg.telegramId },
        data: { isMaster: true },
      })
      return NextResponse.json({ success: true, masterId: existingMasterByTg.id, alreadyExists: true })
    }

    const existingByPhone = await prisma.master.findUnique({
      where: { phone: normalizePhone(profile.phone) },
      select: { id: true, telegramId: true },
    })

    if (existingByPhone) {
      await prisma.master.update({
        where: { id: existingByPhone.id },
        data: { telegramId: tg.telegramId },
      })
      await prisma.customerProfile.update({
        where: { telegramId: tg.telegramId },
        data: { isMaster: true },
      })
      return NextResponse.json({ success: true, masterId: existingByPhone.id, linked: true })
    }

    const email = `${tg.telegramId}@tg.ustatop.local`
    const password = await bcryptjs.hash(`tg-${tg.telegramId}-${Date.now()}`, 10)

    const defaultCategory = await prisma.category.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })

    const created = await prisma.master.create({
      data: {
        email,
        password,
        fullName: profile.fullName,
        phone: normalizePhone(profile.phone),
        serviceArea,
        telegramId: tg.telegramId,
        isActive: true,
        isVerified: false,
        categories: defaultCategory ? { create: [{ categoryId: defaultCategory.id }] } : undefined,
      },
      select: { id: true },
    })

    await prisma.customerProfile.update({
      where: { telegramId: tg.telegramId },
      data: { isMaster: true },
    })

    return NextResponse.json({ success: true, masterId: created.id })
  } catch (err) {
    console.error("[POST /api/master-mode]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
