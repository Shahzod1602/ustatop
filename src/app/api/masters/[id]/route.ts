import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { masterProfileSchema } from "@/lib/validations"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const master = await prisma.master.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        bio: true,
        profilePhoto: true,
        serviceArea: true,
        isVerified: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        categories: { include: { category: { select: { id: true, nameUz: true, icon: true } } } },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
      },
    })
    if (!master) return NextResponse.json({ error: "Usta topilmadi" }, { status: 404 })
    return NextResponse.json(master)
  } catch {
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })

    const { id } = await params

    // Only the master themselves or admin can update
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = masterProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { fullName, phone, bio, serviceArea } = parsed.data

    const updated = await prisma.master.update({
      where: { id },
      data: { fullName, phone, bio, serviceArea },
    })

    return NextResponse.json({ success: true, master: { id: updated.id, fullName: updated.fullName } })
  } catch {
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
