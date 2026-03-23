import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTelegramSessionFromCookies } from "@/lib/telegram-session"
import { masterPostSchema } from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const masterId = searchParams.get("masterId")
    let resolvedMasterId = masterId
    const isPublicMasterQuery = !!masterId

    if (!resolvedMasterId) {
      const tg = await getTelegramSessionFromCookies()
      if (tg?.telegramId) {
        const me = await prisma.master.findFirst({
          where: { telegramId: tg.telegramId },
          select: { id: true },
        })
        resolvedMasterId = me?.id ?? null
      }
    }

    const posts = await prisma.masterPost.findMany({
      where: resolvedMasterId ? { masterId: resolvedMasterId } : isPublicMasterQuery ? undefined : { masterId: "__none__" },
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
    const tg = await getTelegramSessionFromCookies()
    if (!tg?.telegramId) {
      return NextResponse.json({ error: "Telegram session topilmadi" }, { status: 401 })
    }

    const master = await prisma.master.findFirst({
      where: { telegramId: tg.telegramId, isActive: true },
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

    const post = await prisma.masterPost.create({
      data: {
        masterId: master.id,
        title: parsed.data.title.trim(),
        content: parsed.data.content.trim(),
        imageUrl: parsed.data.imageUrl?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, postId: post.id })
  } catch (err) {
    console.error("[POST /api/master-posts]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
