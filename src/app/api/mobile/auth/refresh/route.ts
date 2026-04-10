import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyRefreshToken, signMobileToken, signRefreshToken } from "@/lib/mobile-jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token kiritilishi shart" }, { status: 400 })
    }

    const userId = await verifyRefreshToken(refreshToken)
    if (!userId) {
      return NextResponse.json({ error: "Token muddati tugagan yoki noto'g'ri" }, { status: 401 })
    }

    // Check if user still exists and is active
    const master = await prisma.master.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, isVerified: true, isActive: true },
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
      const newRefreshToken = await signRefreshToken(master.id)

      return NextResponse.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: { id: master.id, name: master.fullName, role: "MASTER", isVerified: master.isVerified },
      })
    }

    // Try as customer
    const customer = await prisma.webCustomer.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true },
    })

    if (customer) {
      const accessToken = await signMobileToken({
        sub: customer.id,
        name: customer.fullName,
        role: "CUSTOMER",
        isVerified: true,
      })
      const newRefreshToken = await signRefreshToken(customer.id)

      return NextResponse.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: { id: customer.id, name: customer.fullName, role: "CUSTOMER", isVerified: true },
      })
    }

    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 })
  } catch (err) {
    console.error("[POST /api/mobile/auth/refresh]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
