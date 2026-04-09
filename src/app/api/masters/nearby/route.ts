import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Haversine formula — returns distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get("lat") ?? "")
  const lng = parseFloat(searchParams.get("lng") ?? "")
  const radius = parseFloat(searchParams.get("radius") ?? "10") // km

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat va lng talab qilinadi" }, { status: 400 })
  }

  // Fetch all active masters that have coordinates
  const masters = await prisma.master.findMany({
    where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true,
      fullName: true,
      phone: true,
      bio: true,
      serviceArea: true,
      isVerified: true,
      rating: true,
      reviewCount: true,
      profilePhoto: true,
      latitude: true,
      longitude: true,
      categories: {
        select: { category: { select: { nameUz: true, icon: true } } },
        take: 2,
      },
    },
  })

  const nearby = masters
    .map((m) => ({
      ...m,
      distance: haversine(lat, lng, m.latitude!, m.longitude!),
    }))
    .filter((m) => m.distance <= radius)
    .sort((a, b) => a.distance - b.distance)

  return NextResponse.json({ masters: nearby })
}
