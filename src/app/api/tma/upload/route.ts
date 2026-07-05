import { NextRequest, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { getUser } from "@/lib/get-user"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Image upload for the Telegram Mini App (Bearer JWT auth).
 * Validates the real file bytes (not the client-supplied MIME) and rate-limits.
 */
const MAX_BYTES = 8 * 1024 * 1024

/** Verify the buffer really starts with a known image signature (magic bytes). */
function looksLikeImage(b: Buffer): boolean {
  if (b.length < 12) return false
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  const gif = b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46
  const webp =
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  return jpeg || png || gif || webp
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== "MASTER") {
      return NextResponse.json({ error: "Usta sifatida kirish kerak" }, { status: 401 })
    }

    const rl = checkRateLimit(`upload:${user.id}`, 20, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: "Juda ko'p yuklash. Birozdan keyin urinib ko'ring." }, { status: 429 })
    }

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Rasm yuborilmadi" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Rasm 8MB dan katta bo'lmasin" }, { status: 413 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Rasm 8MB dan katta bo'lmasin" }, { status: 413 })
    }
    if (!looksLikeImage(buf)) {
      return NextResponse.json({ error: "Faqat rasm yuklash mumkin (JPEG/PNG/WebP/GIF)" }, { status: 400 })
    }

    const res = await new UTApi().uploadFiles(file)
    if (res.error || !res.data) {
      return NextResponse.json({ error: "Yuklashda xatolik" }, { status: 500 })
    }

    return NextResponse.json({ url: res.data.url })
  } catch (err) {
    console.error("[POST /api/tma/upload]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
