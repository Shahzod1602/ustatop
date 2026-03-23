import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reviewSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { requestId, rating, comment } = parsed.data

    // Check request is completed
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, masterId: true },
    })
    if (!request) return NextResponse.json({ error: "So'rov topilmadi" }, { status: 404 })
    if (request.status !== "COMPLETED") {
      return NextResponse.json({ error: "Faqat yakunlangan so'rovlar uchun sharh qoldirish mumkin" }, { status: 400 })
    }
    if (!request.masterId) {
      return NextResponse.json({ error: "Bu so'rovga usta biriktirilmagan" }, { status: 400 })
    }

    // Prevent duplicate review
    const existing = await prisma.review.findUnique({ where: { requestId } })
    if (existing) return NextResponse.json({ error: "Bu so'rov uchun sharh allaqachon qoldirilgan" }, { status: 409 })

    const review = await prisma.review.create({
      data: { requestId, masterId: request.masterId, rating, comment },
    })

    // Update master's average rating
    const allReviews = await prisma.review.findMany({
      where: { masterId: request.masterId },
      select: { rating: true },
    })
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.master.update({
      where: { id: request.masterId },
      data: { rating: Math.round(avg * 10) / 10, reviewCount: allReviews.length },
    })

    return NextResponse.json({ success: true, review })
  } catch (err) {
    console.error("[POST /api/reviews]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
