import { NextRequest, NextResponse } from "next/server"
import { verifyMobileToken } from "@/lib/mobile-jwt"

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization")
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token topilmadi" }, { status: 401 })
    }

    const token = authorization.slice(7)
    const payload = await verifyMobileToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token muddati tugagan yoki noto'g'ri" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        role: payload.role,
        isVerified: payload.isVerified,
      },
    })
  } catch (err) {
    console.error("[GET /api/mobile/auth/session]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
