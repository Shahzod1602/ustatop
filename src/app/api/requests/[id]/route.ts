import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const validStatuses = ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const

function canTransition(current: string, next: string) {
  const transitions: Record<string, string[]> = {
    PENDING: ["ACCEPTED", "CANCELLED"],
    MATCHED: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  }
  return transitions[current]?.includes(next) ?? false
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!validStatuses.includes(status as (typeof validStatuses)[number])) {
      return NextResponse.json({ error: "Noto'g'ri status" }, { status: 400 })
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        masterId: true,
        city: true,
        categoryId: true,
        customerName: true,
        title: true,
      },
    })
    if (!request) {
      return NextResponse.json({ error: "So'rov topilmadi" }, { status: 404 })
    }

    if (!canTransition(request.status, status)) {
      return NextResponse.json({ error: "Status o'zgarishi noto'g'ri" }, { status: 400 })
    }

    const isAdmin = session.user.role === "ADMIN"
    const isMaster = session.user.role === "MASTER"

    const updateData: { status: (typeof validStatuses)[number]; masterId?: string } = { status }

    if (isMaster) {
      const master = await prisma.master.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          isActive: true,
          serviceArea: true,
          categories: { select: { categoryId: true } },
        },
      })
      if (!master || !master.isActive) {
        return NextResponse.json({ error: "Usta topilmadi yoki faol emas" }, { status: 403 })
      }

      const hasCategory = master.categories.some((c) => c.categoryId === request.categoryId)
      const servesCity = master.serviceArea.toLowerCase().includes(request.city.toLowerCase())

      if (status === "ACCEPTED") {
        if (!hasCategory || !servesCity) {
          return NextResponse.json({ error: "Bu so'rov sizga mos emas" }, { status: 403 })
        }
        if (request.masterId && request.masterId !== session.user.id) {
          return NextResponse.json({ error: "So'rov boshqa usta tomonidan qabul qilingan" }, { status: 409 })
        }
        updateData.masterId = session.user.id
      } else {
        if (request.masterId !== session.user.id) {
          return NextResponse.json({ error: "Faqat biriktirilgan usta statusni o'zgartira oladi" }, { status: 403 })
        }
      }
    }

    if (!isAdmin && !isMaster) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 })
    }

    if (isAdmin && status === "ACCEPTED" && !request.masterId) {
      return NextResponse.json({ error: "Admin ACCEPTED holatini faqat biriktirilgan so'rovga bera oladi" }, { status: 400 })
    }

    let updated
    if (isMaster && status === "ACCEPTED") {
      const lock = await prisma.serviceRequest.updateMany({
        where: {
          id,
          status: { in: ["PENDING", "MATCHED"] },
          OR: [{ masterId: null }, { masterId: session.user.id }],
        },
        data: updateData,
      })
      if (lock.count === 0) {
        return NextResponse.json({ error: "So'rov allaqachon boshqa usta tomonidan qabul qilingan" }, { status: 409 })
      }

      updated = await prisma.serviceRequest.findUnique({
        where: { id },
        include: { master: { select: { fullName: true, phone: true } } },
      })
    } else {
      updated = await prisma.serviceRequest.update({
        where: { id },
        data: updateData,
        include: { master: { select: { fullName: true, phone: true } } },
      })
    }

    return NextResponse.json({ success: true, request: updated })
  } catch (err) {
    console.error("[PATCH /api/requests/:id]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        category: true,
        master: { select: { id: true, fullName: true, phone: true } },
        images: true,
        reviews: { include: { master: { select: { fullName: true, profilePhoto: true } } } },
      },
    })
    if (!request) return NextResponse.json({ error: "So'rov topilmadi" }, { status: 404 })
    return NextResponse.json(request)
  } catch (err) {
    console.error("[GET /api/requests/:id]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
