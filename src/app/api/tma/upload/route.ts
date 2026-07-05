import { NextRequest, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { getUser } from "@/lib/get-user"

/**
 * Image upload for the Telegram Mini App.
 * The Mini App authenticates with a Bearer JWT (not a cookie), so it can't use
 * the cookie-based UploadThing route directly. This endpoint verifies the Bearer
 * token, then uploads the file server-side via UTApi and returns its URL.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.role !== "MASTER") {
      return NextResponse.json({ error: "Usta sifatida kirish kerak" }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Rasm yuborilmadi" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Faqat rasm yuklash mumkin" }, { status: 400 })
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Rasm 8MB dan katta bo'lmasin" }, { status: 413 })
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
