import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tizimga kirish kerak" }, { status: 401 })
    }

    // Master mode is now handled through the registration flow
    // Customers who want to become masters should register as a master
    return NextResponse.json({
      error: "Usta bo'lish uchun /auth/register sahifasidan ro'yxatdan o'ting",
    }, { status: 400 })
  } catch (err) {
    console.error("[POST /api/master-mode]", err)
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 })
  }
}
