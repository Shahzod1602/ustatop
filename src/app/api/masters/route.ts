import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Public masters catalog. Powers the mobile "Ustalar" list.
 * Supports optional filtering by categoryId, city and a text search, with pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId")
    const city = searchParams.get("city")
    const search = searchParams.get("search")?.trim()
    const take = Math.min(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 50)
    const skip = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0)

    const where: Record<string, unknown> = { isActive: true }
    if (categoryId) where.categories = { some: { categoryId } }
    if (city) where.serviceArea = { contains: city, mode: "insensitive" }
    if (search) where.fullName = { contains: search, mode: "insensitive" }

    const masters = await prisma.master.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phone: true,
        bio: true,
        profilePhoto: true,
        serviceArea: true,
        isVerified: true,
        rating: true,
        reviewCount: true,
        categories: { select: { category: { select: { id: true, nameUz: true, icon: true } } } },
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      take,
      skip,
    })

    return NextResponse.json({ masters })
  } catch (err) {
    console.error("[GET /api/masters]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
