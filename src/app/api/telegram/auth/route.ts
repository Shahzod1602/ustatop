import { NextRequest, NextResponse } from "next/server"
import { verifyTelegramInitData } from "@/lib/telegram"
import { createTelegramSessionToken, TG_SESSION_COOKIE } from "@/lib/telegram-session"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const initData = typeof body?.initData === "string" ? body.initData : ""

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN topilmadi" }, { status: 500 })
    }

    const parsed = verifyTelegramInitData(initData, botToken)
    if (!parsed?.user) {
      return NextResponse.json({ error: "Telegram auth xato" }, { status: 401 })
    }

    const token = await createTelegramSessionToken({
      telegramId: String(parsed.user.id),
      firstName: parsed.user.first_name,
      username: parsed.user.username,
    })

    const res = NextResponse.json({
      success: true,
      user: {
        id: parsed.user.id,
        firstName: parsed.user.first_name,
        username: parsed.user.username,
      },
    })

    res.cookies.set(TG_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (err) {
    console.error("[POST /api/telegram/auth]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
