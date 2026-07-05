import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/get-user"
import { customerProfileSchema } from "@/lib/validations"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }

    const role = user.role

    if (role === "MASTER") {
      const master = await prisma.master.findUnique({
        where: { id: user.id },
        select: { id: true, fullName: true, phone: true, serviceArea: true, bio: true },
      })
      return NextResponse.json({
        profile: {
          fullName: master?.fullName ?? user.name ?? "",
          phone: master?.phone ?? "",
          city: master?.serviceArea ?? "Toshkent",
          isMaster: true,
        },
      })
    }

    if (role === "CUSTOMER") {
      const customer = await prisma.webCustomer.findUnique({
        where: { id: user.id },
        select: { id: true, fullName: true, phone: true },
      })
      return NextResponse.json({
        profile: {
          fullName: customer?.fullName ?? user.name ?? "",
          phone: customer?.phone ?? "",
          city: "Toshkent",
          isMaster: false,
        },
      })
    }

    return NextResponse.json({
      profile: {
        fullName: user.name ?? "",
        phone: "",
        city: "Toshkent",
        isMaster: false,
      },
    })
  } catch (err) {
    console.error("[GET /api/profile]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = customerProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const fullName = parsed.data.fullName.trim()
    const phone = parsed.data.phone?.trim() || null
    const city = parsed.data.city?.trim() || "Toshkent"

    if (user.role === "MASTER") {
      const profile = await prisma.master.update({
        where: { id: user.id },
        data: { fullName, phone: phone ?? undefined, serviceArea: city },
        // Never return the password hash / internal columns to the client.
        select: { id: true, fullName: true, phone: true, serviceArea: true },
      })
      return NextResponse.json({
        success: true,
        profile: { fullName: profile.fullName, phone: profile.phone, city: profile.serviceArea, isMaster: true },
      })
    }

    if (user.role === "CUSTOMER") {
      const profile = await prisma.webCustomer.update({
        where: { id: user.id },
        data: { fullName, phone: phone ?? undefined },
        select: { id: true, fullName: true, phone: true },
      })
      return NextResponse.json({
        success: true,
        profile: { fullName: profile.fullName, phone: profile.phone, city, isMaster: false },
      })
    }

    return NextResponse.json({ error: "Noma'lum rol" }, { status: 400 })
  } catch (err) {
    console.error("[POST /api/profile]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
