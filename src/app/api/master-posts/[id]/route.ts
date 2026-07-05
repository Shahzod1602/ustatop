import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUser } from "@/lib/get-user"

/** Delete a work post — only its owner (the master) may delete it. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user || user.role !== "MASTER") {
      return NextResponse.json({ error: "Usta sifatida kirish kerak" }, { status: 401 })
    }
    const { id } = await params
    const post = await prisma.masterPost.findUnique({ where: { id }, select: { masterId: true } })
    if (!post) return NextResponse.json({ error: "Post topilmadi" }, { status: 404 })
    if (post.masterId !== user.id) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 })
    }
    await prisma.masterPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/master-posts/:id]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
