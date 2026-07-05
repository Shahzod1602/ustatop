import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reviewSchema } from "@/lib/validations"
import { getUser } from "@/lib/get-user"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Only the customer who owns the request may review it.
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Faqat mijozlar sharh qoldira oladi" }, { status: 403 })
    }

    const rl = checkRateLimit(`review:${user.id}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: "Juda ko'p so'rov. Birozdan keyin urinib ko'ring." }, { status: 429 })
    }

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
      select: { id: true, status: true, masterId: true, customerPhone: true },
    })
    if (!request) return NextResponse.json({ error: "So'rov topilmadi" }, { status: 404 })

    // Ownership: the caller must be the customer whose phone is on the request.
    const customer = await prisma.webCustomer.findUnique({
      where: { id: user.id },
      select: { phone: true },
    })
    if (!customer || customer.phone !== request.customerPhone) {
      return NextResponse.json({ error: "Bu so'rov sizga tegishli emas" }, { status: 403 })
    }

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
