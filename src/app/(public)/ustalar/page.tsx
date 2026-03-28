import Link from "next/link"
import { ArrowLeft, Star, CheckCircle2, MapPin, Phone, Eye, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"

type Params = Promise<{
  requestId?: string
  masterId?: string
  city?: string
  minRating?: string
  sort?: string
  q?: string
}>

export const dynamic = "force-dynamic"

const AVATAR_PALETTES = [
  { bg: "#e8f4fd", text: "#1a6fa8" },
  { bg: "#e8f7ee", text: "#1a7a3f" },
  { bg: "#fde8e8", text: "#b01c1c" },
  { bg: "#f0e8fd", text: "#6b1aa8" },
  { bg: "#fdf4e8", text: "#a86b1a" },
  { bg: "#e8f0fd", text: "#1a3fa8" },
]

function avatarPalette(name: string) {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length]
}

function initials(fullName: string) {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function yearsActive(createdAt: Date) {
  const years = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
  return years < 1 ? "Yangi usta" : `${years}+ yil tajriba`
}

function extractPrice(bio?: string | null) {
  if (!bio) return "Kelishiladi"
  const matched = bio.match(/Narxlar:\s*([^\n]+)/i)
  return matched?.[1]?.trim() || "Kelishiladi"
}

export default async function MastersPage({ searchParams }: { searchParams: Params }) {
  const { requestId, masterId, city, minRating: minRatingRaw, sort, q } = await searchParams
  const minRating = minRatingRaw ? Number(minRatingRaw) : undefined

  const whereBase = {
    isActive: true,
    ...(q ? { fullName: { contains: q, mode: "insensitive" as const } } : {}),
    ...(city ? { serviceArea: { contains: city, mode: "insensitive" as const } } : {}),
    ...(minRating && !Number.isNaN(minRating) ? { rating: { gte: minRating } } : {}),
  }

  let masters = await prisma.master.findMany({
    where: whereBase,
    orderBy: sort === "new" ? [{ createdAt: "desc" }] : [{ isVerified: "desc" }, { rating: "desc" }],
    take: 20,
    select: {
      id: true,
      fullName: true,
      phone: true,
      profilePhoto: true,
      isVerified: true,
      rating: true,
      reviewCount: true,
      bio: true,
      serviceArea: true,
      createdAt: true,
      categories: { include: { category: true }, take: 1 },
      _count: { select: { posts: true } },
    },
  })

  if (requestId) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { categoryId: true, city: true },
    })

    if (request) {
      masters = await prisma.master.findMany({
        where: {
          ...whereBase,
          serviceArea: { contains: request.city, mode: "insensitive" },
          categories: { some: { categoryId: request.categoryId } },
        },
        orderBy: sort === "new" ? [{ createdAt: "desc" }] : [{ isVerified: "desc" }, { rating: "desc" }],
        take: 20,
        select: {
          id: true,
          fullName: true,
          phone: true,
          profilePhoto: true,
          isVerified: true,
          rating: true,
          reviewCount: true,
          bio: true,
          serviceArea: true,
          createdAt: true,
          categories: { include: { category: true }, take: 1 },
          _count: { select: { posts: true } },
        },
      })
    }
  }

  if (masterId) {
    masters = masters.filter((m) => m.id === masterId)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-4 text-[#3a3a3a]">
      <header className="bg-[#ff6b2b] px-3 pt-safe pb-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl bg-white/20 p-2 text-white hover:bg-white/30">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Ustalar ro'yxati</h1>
            <p className="text-xs text-white/70">Mos ustani reyting va tajriba bo'yicha tanlang</p>
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="surface-card fade-up mx-3 mb-3 mt-3 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-extrabold text-[#3a3a3a]">
            <span className="text-[#ff6b2b]">{masters.length}</span> ta usta topildi
          </p>
          <Link href="/ustalar" className="chip">
            Tozalash
          </Link>
        </div>

        <form className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Usta nomi..."
            className="h-10 rounded-xl border border-[#e9e9e9] bg-white px-3 text-sm text-[#3a3a3a] outline-none focus:border-[#ff6b2b]"
          />
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Shahar..."
            className="h-10 rounded-xl border border-[#e9e9e9] bg-white px-3 text-sm text-[#3a3a3a] outline-none focus:border-[#ff6b2b]"
          />
          <button className="action-primary h-10 px-3 py-0 text-sm">Qidirish</button>
        </form>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold">
          <Link
            href={`/ustalar${requestId ? `?requestId=${requestId}` : ""}`}
            className={`rounded-xl border px-2 py-2 text-center ${!city && !minRating && !sort ? "border-[#ff6b2b]/40 bg-orange-50 text-[#ff6b2b]" : "border-[#e9e9e9] bg-white text-[#8c8c8c]"}`}
          >
            Barchasi
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}minRating=4.5`}
            className={`rounded-xl border px-2 py-2 text-center ${minRating && minRating >= 4.5 ? "border-[#ff6b2b]/40 bg-orange-50 text-[#ff6b2b]" : "border-[#e9e9e9] bg-white text-[#8c8c8c]"}`}
          >
            Reyting 4.5+
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}sort=new`}
            className={`rounded-xl border px-2 py-2 text-center ${sort === "new" ? "border-[#ff6b2b]/40 bg-orange-50 text-[#ff6b2b]" : "border-[#e9e9e9] bg-white text-[#8c8c8c]"}`}
          >
            Yangi
          </Link>
        </div>
      </div>

      {/* Masters List */}
      <div className="space-y-2.5 fade-up stagger-1 px-3">
        {masters.length === 0 && (
          <div className="surface-card p-6 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-[#c0c0c0]" />
            <p className="text-sm font-bold text-[#3a3a3a]">Usta topilmadi</p>
            <p className="mt-1 text-xs text-[#8c8c8c]">Filtrni o'zgartirib ko'ring</p>
            <Link href="/ustalar" className="action-primary mt-4 inline-flex text-sm">
              Barcha ustalar
            </Link>
          </div>
        )}

        {masters.map((m) => {
          const palette = avatarPalette(m.fullName)
          return (
            <article key={m.id} className="surface-card p-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
                  style={{ background: palette.bg, color: palette.text }}
                >
                  {m.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.profilePhoto} alt={m.fullName} className="h-20 w-20 rounded-2xl object-cover" />
                  ) : (
                    initials(m.fullName)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="truncate text-[17px] font-extrabold text-[#3a3a3a]">{m.fullName}</p>
                    {m.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Tasdiqlangan
                      </span>
                    )}
                  </div>

                  <div className="mb-1 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
                    <span className="text-sm font-bold text-[#3a3a3a]">{m.rating.toFixed(1)}</span>
                    <span className="text-xs text-[#8c8c8c]">({m.reviewCount} sharh)</span>
                  </div>

                  <p className="text-sm font-semibold text-[#5a5a5a]">
                    {yearsActive(m.createdAt)} · {extractPrice(m.bio)}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#8c8c8c]">
                    <MapPin className="h-3.5 w-3.5" />
                    {m.serviceArea} · {m.categories[0]?.category.nameUz ?? "Usta"}
                  </div>

                  {m._count.posts > 0 && (
                    <p className="mt-1 text-xs text-[#8c8c8c]">{m._count.posts} ta ish namunasi</p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a href={`tel:${m.phone}`} className="action-amber inline-flex h-10 items-center justify-center gap-1 text-sm">
                      <Phone className="h-4 w-4" />
                      Qo'ng'iroq
                    </a>
                    <Link href={`/usta/${m.id}`} className="action-primary inline-flex h-10 items-center justify-center gap-1 text-sm">
                      <Eye className="h-4 w-4" />
                      Profil
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
