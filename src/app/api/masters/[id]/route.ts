import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/get-user"
import { masterProfileSchema } from "@/lib/validations"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const master = await prisma.master.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        extraPhones: true,
        telegramUsername: true,
        bio: true,
        profilePhoto: true,
        serviceArea: true,
        isVerified: true,
        rating: true,
        reviewCount: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        categories: { include: { category: { select: { id: true, nameUz: true, icon: true } } } },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, title: true, content: true, imageUrl: true, createdAt: true },
        },
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
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })

    const { id } = await params

    // Only the master themselves or admin can update
    if (user.id !== id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = masterProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { fullName, bio, serviceArea, pricing, profilePhoto, extraPhones, categoryIds, latitude, longitude } = parsed.data

    // Replace category links if provided (validate the ids exist first).
    if (categoryIds && categoryIds.length > 0) {
      const valid = await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } })
      const validIds = valid.map((c) => c.id)
      if (validIds.length > 0) {
        await prisma.masterCategory.deleteMany({ where: { masterId: id } })
        await prisma.masterCategory.createMany({ data: validIds.map((categoryId) => ({ masterId: id, categoryId })) })
      }
    }

    const updated = await prisma.master.update({
      where: { id },
      data: {
        fullName,
        // Primary `phone` is intentionally NOT updated here — it's locked after onboarding.
        serviceArea,
        bio: [bio, pricing ? `Narxlar: ${pricing}` : ""].filter(Boolean).join("\n") || null,
        ...(extraPhones ? { extraPhones: extraPhones.map((p) => (p.startsWith("+") ? p : `+${p}`)) } : {}),
        ...(profilePhoto ? { profilePhoto } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
      },
    })

    return NextResponse.json({ success: true, master: { id: updated.id, fullName: updated.fullName } })
  } catch {
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
