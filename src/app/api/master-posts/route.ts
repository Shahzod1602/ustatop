import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/get-user"
import { masterPostSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const masterId = searchParams.get("masterId")
    let resolvedMasterId = masterId

    if (!resolvedMasterId) {
      const user = await getUser()
      if (user?.role === "MASTER") {
        resolvedMasterId = user.id
      }
    }

    const posts = await prisma.masterPost.findMany({
      where: resolvedMasterId ? { masterId: resolvedMasterId } : { masterId: "__none__" },
      include: {
        master: {
          select: {
            id: true,
            fullName: true,
            serviceArea: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ items: posts })
  } catch (err) {
    console.error("[GET /api/master-posts]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== "MASTER") {
      return NextResponse.json({ error: "Usta sifatida kirish kerak" }, { status: 401 })
    }

    const master = await prisma.master.findUnique({
      where: { id: user.id, isActive: true },
      select: { id: true },
    })
    if (!master) {
      return NextResponse.json({ error: "Usta rejimi yoqilmagan" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = masterPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ma'lumotlar noto'g'ri", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const imageUrl = parsed.data.imageUrl?.trim() || null
    const content = parsed.data.content?.trim() || ""
    // An Instagram-style post needs at least a photo or a caption.
    if (!imageUrl && !content) {
      return NextResponse.json({ error: "Rasm yoki izoh kiriting" }, { status: 400 })
    }

    const post = await prisma.masterPost.create({
      data: {
        masterId: master.id,
        title: parsed.data.title?.trim() || "",
        content,
        imageUrl,
      },
    })

    return NextResponse.json({ success: true, postId: post.id })
  } catch (err) {
    console.error("[POST /api/master-posts]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
