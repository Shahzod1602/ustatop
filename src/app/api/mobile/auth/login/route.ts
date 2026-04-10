import { NextRequest, NextResponse } from "next/server"
import { validateMasterCredentials, validateCustomerCredentials } from "@/lib/auth-helpers"
import { signMobileToken, signRefreshToken } from "@/lib/mobile-jwt"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rl = checkRateLimit(`mobile-login:${ip}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { phone, password, provider } = body

    if (!phone || !password) {
      return NextResponse.json({ error: "Telefon va parol kiritilishi shart" }, { status: 400 })
    }

    let user
    try {
      if (provider === "customer-credentials" || provider === "customer") {
        user = await validateCustomerCredentials(phone, password)
      } else {
        user = await validateMasterCredentials(phone, password)
      }
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Telefon raqam yoki parol noto'g'ri" },
        { status: 401 }
      )
    }

    const accessToken = await signMobileToken({
      sub: user.id,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    })

    const refreshToken = await signRefreshToken(user.id)

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    })
  } catch (err) {
    console.error("[POST /api/mobile/auth/login]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
