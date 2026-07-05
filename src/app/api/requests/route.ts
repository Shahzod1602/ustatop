import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serviceRequestSchema } from "@/lib/validations"
import { getUser } from "@/lib/get-user"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateKey = `new-request:${user?.id ?? ip}`
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

    const customerName = data.customerName?.trim() || user?.name || "Mijoz"
    const customerPhone = data.customerPhone?.trim()
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
      select: { id: true },
    })

    // Update request to MATCHED if masters found
    if (matchingMasters.length > 0) {
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: { status: "MATCHED" },
      })
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
    // Authentication required — this endpoint returns customer PII.
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const allowedStatuses = ["PENDING", "MATCHED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const

    const where: Record<string, unknown> = {}
    if (status) {
      if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
        return NextResponse.json({ error: "Noto'g'ri status" }, { status: 400 })
      }
      where.status = status
    }

    // Scope by role — never trust a client-supplied masterId.
    let restrictToMaster: string | null = null
    if (user.role === "MASTER") {
      const master = await prisma.master.findUnique({
        where: { id: user.id },
        include: { categories: { select: { categoryId: true } } },
      })
      if (!master) return NextResponse.json({ error: "Usta topilmadi" }, { status: 404 })
      restrictToMaster = master.id
      const categoryIds = master.categories.map((c) => c.categoryId)
      // A master sees jobs in their city/categories OR jobs already assigned to them.
      where.OR = [
        { city: { contains: master.serviceArea, mode: "insensitive" }, categoryId: { in: categoryIds } },
        { masterId: master.id },
      ]
    } else if (user.role === "CUSTOMER") {
      const customer = await prisma.webCustomer.findUnique({
        where: { id: user.id },
        select: { phone: true },
      })
      where.customerPhone = customer?.phone ?? "__none__"
    }
    // ADMIN: no extra scope — sees everything.

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        category: { select: { nameUz: true, icon: true } },
        images: { select: { url: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    // Redact customer contact until a master is actually assigned to the request.
    const sanitized =
      user.role === "ADMIN"
        ? requests
        : requests.map((r) => {
            const isOwnerCustomer = user.role === "CUSTOMER"
            const isAssignedMaster = restrictToMaster !== null && r.masterId === restrictToMaster
            if (isOwnerCustomer || isAssignedMaster) return r
            return { ...r, customerPhone: "", address: null }
          })

    return NextResponse.json(sanitized)
  } catch (err) {
    console.error("[GET /api/requests]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
