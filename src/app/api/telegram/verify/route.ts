import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInitData, telegramDisplayName } from "@/lib/telegram-initdata"
import { signMobileToken, signRefreshToken } from "@/lib/mobile-jwt"

/**
 * Telegram Mini App auth bootstrap.
 * We validate the initData signature to learn WHICH bot opened the app:
 *   - usta bot   -> master view (Kabinet)
 *   - mijoz bot  -> customer view (feed) — even if the person is a registered master
 * The Mini App uses the returned `botKind` to pick the screen, so one URL works
 * for both bots.
 */
export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()
    if (!initData || typeof initData !== "string") {
      return NextResponse.json({ error: "initData talab qilinadi" }, { status: 400 })
    }

    const ustaToken = process.env.USTA_BOT_TOKEN
    const mijozToken = process.env.MIJOZ_BOT_TOKEN

    let botKind: "master" | "customer" | null = null
    let validated = ustaToken ? validateInitData(initData, ustaToken) : null
    if (validated) botKind = "master"
    if (!validated && mijozToken) {
      validated = validateInitData(initData, mijozToken)
      if (validated) botKind = "customer"
    }
    if (!validated || !botKind) {
      return NextResponse.json({ error: "initData yaroqsiz yoki eskirgan" }, { status: 401 })
    }

    const tgId = String(validated.user.id)
    const name = telegramDisplayName(validated.user)

    // ── Master bot → master Kabinet ──
    if (botKind === "master") {
      const master = await prisma.master.findUnique({
        where: { telegramId: tgId },
        select: { id: true, fullName: true, isActive: true, isVerified: true },
      })
      if (!master) {
        // Opened the master bot but hasn't registered yet.
        return NextResponse.json({ botKind, needsMasterRegistration: true, name })
      }
      if (!master.isActive) {
        return NextResponse.json({ error: "Akkaunt bloklangan" }, { status: 403 })
      }
      const accessToken = await signMobileToken({ sub: master.id, name: master.fullName, role: "MASTER", isVerified: master.isVerified })
      const refreshToken = await signRefreshToken(master.id)
      return NextResponse.json({
        botKind,
        accessToken,
        refreshToken,
        user: { id: master.id, name: master.fullName, role: "MASTER", isVerified: master.isVerified },
      })
    }

    // ── Customer bot → feed (browse) ──
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
    const accessToken = await signMobileToken({ sub: customer.id, name: customer.fullName, role: "CUSTOMER", isVerified: true })
    const refreshToken = await signRefreshToken(customer.id)
    return NextResponse.json({
      botKind,
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
