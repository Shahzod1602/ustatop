import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Public Instagram-style feed: recent master work posts, newest first.
 * Optional ?categoryId= filters to masters in that category.
 * Each item carries the master's contact info so the app can deep-link to Telegram.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const take = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 40)
    const skip = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0)

    const where = categoryId
      ? { master: { isActive: true, categories: { some: { categoryId } } } }
      : { master: { isActive: true } }

    const posts = await prisma.masterPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        master: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            serviceArea: true,
            isVerified: true,
            rating: true,
            reviewCount: true,
            telegramUsername: true,
            phone: true,
            categories: { select: { category: { select: { nameUz: true, icon: true } } }, take: 1 },
          },
        },
      },
    })

    const items = posts.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      master: {
        id: p.master.id,
        fullName: p.master.fullName,
        profilePhoto: p.master.profilePhoto,
        serviceArea: p.master.serviceArea,
        isVerified: p.master.isVerified,
        rating: p.master.rating,
        reviewCount: p.master.reviewCount,
        telegramUsername: p.master.telegramUsername,
        phone: p.master.phone,
        category: p.master.categories[0]?.category ?? null,
      },
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error("[GET /api/feed]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
