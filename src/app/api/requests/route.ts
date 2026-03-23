import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serviceRequestSchema } from "@/lib/validations"
import { getTelegramSessionFromCookies } from "@/lib/telegram-session"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendTelegramMessage } from "@/lib/telegram-bot"

export async function POST(req: NextRequest) {
  try {
    const tg = await getTelegramSessionFromCookies()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateKey = `new-request:${tg?.telegramId ?? ip}`
    const rl = checkRateLimit(rateKey, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: "Juda ko'p so'rov. Birozdan keyin urinib ko'ring." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = serviceRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const profile = tg?.telegramId
      ? await prisma.customerProfile.findUnique({ where: { telegramId: tg.telegramId } })
      : null

    const customerName = data.customerName?.trim() || profile?.fullName || tg?.firstName || "Mijoz"
    const customerPhone = data.customerPhone?.trim() || profile?.phone
    if (!customerPhone) {
      return NextResponse.json({ error: "Telefon raqam topilmadi. Account bo'limida raqamni kiriting." }, { status: 400 })
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      return NextResponse.json({ error: "Kategoriya topilmadi" }, { status: 404 })
    }

    // Create service request
    const request = await prisma.serviceRequest.create({
      data: {
        customerName,
        customerPhone,
        customerTelegramId: tg?.telegramId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        urgency: data.urgency,
        address: data.address,
        city: data.city,
        status: "PENDING",
      },
    })

    // Simple matching: find masters with this category and city
    const matchingMasters = await prisma.master.findMany({
      where: {
        isActive: true,
        serviceArea: { contains: data.city, mode: "insensitive" },
        categories: { some: { categoryId: data.categoryId } },
      },
      select: { id: true, telegramId: true },
    })

    // Update request to MATCHED if masters found
    if (matchingMasters.length > 0) {
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: { status: "MATCHED" },
      })

      await Promise.all(
        matchingMasters
          .filter((m) => !!m.telegramId)
          .map((m) =>
            sendTelegramMessage(
              m.telegramId as string,
              `🔔 <b>Yangi so'rov</b>\n\n📌 ${request.title}\n📍 ${request.city}\n📞 ${request.customerPhone}`,
              {
                inline_keyboard: [
                  [
                    { text: "✅ Qabul qilish", callback_data: `accept_${request.id}` },
                    { text: "❌ Rad etish", callback_data: `reject_${request.id}` },
                  ],
                ],
              }
            )
          )
      )
    }

    return NextResponse.json({
      success: true,
      requestId: request.id,
      matchedMastersCount: matchingMasters.length,
    })
  } catch (err) {
    console.error("[POST /api/requests]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const masterId = searchParams.get("masterId")
    const status = searchParams.get("status")
    const allowedStatuses = ["PENDING", "MATCHED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const

    const where: Record<string, unknown> = {}
    if (status) {
      if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
        return NextResponse.json({ error: "Noto'g'ri status" }, { status: 400 })
      }
      where.status = status
    }

    // If masterId, return requests in master's city & categories
    if (masterId) {
      const master = await prisma.master.findUnique({
        where: { id: masterId },
        include: { categories: { select: { categoryId: true } } },
      })
      if (!master) return NextResponse.json({ error: "Usta topilmadi" }, { status: 404 })

      const categoryIds = master.categories.map((c) => c.categoryId)
      where.city = { contains: master.serviceArea, mode: "insensitive" }
      where.categoryId = { in: categoryIds }
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        category: { select: { nameUz: true, icon: true } },
        images: { select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(requests)
  } catch (err) {
    console.error("[GET /api/requests]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
