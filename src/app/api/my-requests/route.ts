import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }

    // Find requests by customer phone
    let phone: string | null = null

    if (session.user.role === "CUSTOMER") {
      const customer = await prisma.webCustomer.findUnique({
        where: { id: session.user.id },
        select: { phone: true },
      })
      phone = customer?.phone ?? null
    } else if (session.user.role === "MASTER") {
      const master = await prisma.master.findUnique({
        where: { id: session.user.id },
        select: { phone: true },
      })
      phone = master?.phone ?? null
    }

    if (!phone) {
      return NextResponse.json({ items: [] })
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { customerPhone: phone },
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
