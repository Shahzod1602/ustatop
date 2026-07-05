import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInitDataAny, telegramDisplayName } from "@/lib/telegram-initdata"
import { signMobileToken, signRefreshToken } from "@/lib/mobile-jwt"

/**
 * Telegram Mini App auth bootstrap.
 * The Mini App sends the raw `initData` from Telegram.WebApp; we validate its
 * HMAC signature against our bot tokens (never trusting the client), then issue
 * the same mobile JWT the native app uses. No passwords involved.
 */
export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()
    if (!initData || typeof initData !== "string") {
      return NextResponse.json({ error: "initData talab qilinadi" }, { status: 400 })
    }

    const tokens = [process.env.USTA_BOT_TOKEN, process.env.MIJOZ_BOT_TOKEN]
    const validated = validateInitDataAny(initData, tokens)
    if (!validated) {
      return NextResponse.json({ error: "initData yaroqsiz yoki eskirgan" }, { status: 401 })
    }

    const tgId = String(validated.user.id)
    const name = telegramDisplayName(validated.user)

    // 1) Registered master?
    const master = await prisma.master.findUnique({
      where: { telegramId: tgId },
      select: { id: true, fullName: true, isActive: true, isVerified: true },
    })
    if (master) {
      if (!master.isActive) {
        return NextResponse.json({ error: "Akkaunt bloklangan" }, { status: 403 })
      }
      const accessToken = await signMobileToken({
        sub: master.id,
        name: master.fullName,
        role: "MASTER",
        isVerified: master.isVerified,
      })
      const refreshToken = await signRefreshToken(master.id)
      return NextResponse.json({
        accessToken,
        refreshToken,
        user: { id: master.id, name: master.fullName, role: "MASTER", isVerified: master.isVerified },
        needsPhone: false,
      })
    }

    // 2) Customer — look up or auto-create by telegramId (phone collected later).
    let customer = await prisma.webCustomer.findUnique({
      where: { telegramId: tgId },
      select: { id: true, fullName: true, phone: true },
    })
    if (!customer) {
      customer = await prisma.webCustomer.create({
        data: { telegramId: tgId, fullName: name },
        select: { id: true, fullName: true, phone: true },
      })
    }

    const accessToken = await signMobileToken({
      sub: customer.id,
      name: customer.fullName,
      role: "CUSTOMER",
      isVerified: true,
    })
    const refreshToken = await signRefreshToken(customer.id)
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: { id: customer.id, name: customer.fullName, role: "CUSTOMER", isVerified: true },
      needsPhone: !customer.phone,
    })
  } catch (err) {
    console.error("[POST /api/telegram/verify]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
