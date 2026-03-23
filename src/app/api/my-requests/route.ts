import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTelegramSessionFromCookies } from "@/lib/telegram-session"

export async function GET() {
  try {
    const tg = await getTelegramSessionFromCookies()
    if (!tg?.telegramId) {
      return NextResponse.json({ error: "Telegram session topilmadi" }, { status: 401 })
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { customerTelegramId: tg.telegramId },
      include: {
        category: { select: { nameUz: true, icon: true } },
        master: { select: { fullName: true, phone: true, rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ items: requests })
  } catch (err) {
    console.error("[GET /api/my-requests]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
