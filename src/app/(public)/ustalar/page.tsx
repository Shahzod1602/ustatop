import Link from "next/link"
import { ArrowLeft, Star, CheckCircle2, MapPin, Phone, Eye, Users, SlidersHorizontal } from "lucide-react"
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
    <div className="min-h-screen bg-[#f0ede8] pb-4 text-[#1a1a1a]">

      {/* Header */}
      <header className="relative overflow-hidden bg-[#1a1a2e] px-3 pt-safe pb-4">
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#ff6b2b]/15" />
        <div className="relative flex items-center gap-3">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[17px] font-black leading-tight text-white">Ustalar ro'yxati</h1>
            <p className="text-[11px] text-white/50">Reyting va tajriba bo'yicha tanlang</p>
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="fade-up mx-3 mb-3 mt-3 rounded-2xl border border-[#e0d8d0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#ff6b2b]" />
            <p className="text-[14px] font-black text-[#1a1a1a]">
              <span className="text-[#ff6b2b]">{masters.length}</span> ta usta topildi
            </p>
          </div>
          {(q || city || minRating || sort) && (
            <Link href="/ustalar" className="rounded-lg border border-[#e0d8d0] bg-[#f7f4f0] px-2.5 py-1 text-[11px] font-bold text-[#8c8c8c] hover:border-[#ff6b2b]/30 hover:text-[#ff6b2b] transition-colors">
              Tozalash
            </Link>
          )}
        </div>

        <form className="mb-3 grid grid-cols-1 gap-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Usta nomi..."
              className="h-10 rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b0a8a0] focus:border-[#ff6b2b] transition-colors"
            />
            <input
              name="city"
              defaultValue={city ?? ""}
              placeholder="Shahar..."
              className="h-10 rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b0a8a0] focus:border-[#ff6b2b] transition-colors"
            />
          </div>
          <button className="h-10 rounded-xl bg-[#ff6b2b] text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,107,43,0.28)] transition hover:bg-[#e85d20] active:translate-y-[1px]">
            Qidirish
          </button>
        </form>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Barchasi", href: `/ustalar${requestId ? `?requestId=${requestId}` : ""}`, active: !city && !minRating && !sort },
            { label: "Reyting 4.5+", href: `/ustalar?${requestId ? `requestId=${requestId}&` : ""}minRating=4.5`, active: !!(minRating && minRating >= 4.5) },
            { label: "Yangi", href: `/ustalar?${requestId ? `requestId=${requestId}&` : ""}sort=new`, active: sort === "new" },
          ].map(({ label, href, active }) => (
            <Link
              key={label}
              href={href}
              className={`rounded-xl border px-2 py-2 text-center text-[11px] font-bold transition-all ${
                active
                  ? "border-[#ff6b2b]/40 bg-orange-50 text-[#ff6b2b] shadow-[0_2px_8px_rgba(255,107,43,0.12)]"
                  : "border-[#ede8e0] bg-[#faf8f5] text-[#8c8c8c] hover:border-[#ff6b2b]/20 hover:text-[#ff6b2b]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Masters List */}
      <div className="fade-up stagger-1 space-y-2.5 px-3">
        {masters.length === 0 && (
          <div className="rounded-2xl border border-[#e0d8d0] bg-white p-8 text-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ede8]">
              <Users className="h-7 w-7 text-[#c0b8b0]" />
            </div>
            <p className="text-[15px] font-black text-[#1a1a1a]">Usta topilmadi</p>
            <p className="mt-1 text-sm text-[#8c8c8c]">Filtrni o'zgartirib ko'ring</p>
            <Link
              href="/ustalar"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#ff6b2b] px-5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,107,43,0.28)] transition hover:bg-[#e85d20]"
            >
              Barcha ustalar
            </Link>
          </div>
        )}

        {masters.map((m) => {
          const palette = avatarPalette(m.fullName)
          return (
            <article key={m.id} className="group rounded-2xl border border-[#e0d8d0] bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all hover:border-[#ff6b2b]/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl text-lg font-black"
                  style={{ background: palette.bg, color: palette.text }}
                >
                  {m.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.profilePhoto} alt={m.fullName} className="h-[72px] w-[72px] rounded-2xl object-cover" />
                  ) : (
                    initials(m.fullName)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Name + verified */}
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="truncate text-[16px] font-black text-[#1a1a1a]">{m.fullName}</p>
                    {m.isVerified && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Tasdiqlangan
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                      <span className="text-[13px] font-black text-[#1a1a1a]">{m.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[11px] text-[#8c8c8c]">({m.reviewCount} sharh)</span>
                    {m._count.posts > 0 && (
                      <span className="text-[11px] text-[#8c8c8c]">· {m._count.posts} ish</span>
                    )}
                  </div>

                  {/* Info row */}
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-[#8c8c8c]">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{m.serviceArea} · {m.categories[0]?.category.nameUz ?? "Usta"}</span>
                  </div>

                  {/* Experience + price */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded-md bg-[#f0ede8] px-2 py-0.5 font-semibold text-[#6a6460]">
                      {yearsActive(m.createdAt)}
                    </span>
                    <span className="rounded-md bg-[#f0ede8] px-2 py-0.5 font-semibold text-[#6a6460]">
                      {extractPrice(m.bio)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${m.phone}`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#ff6b2b]/30 bg-orange-50 text-[12px] font-bold text-[#ff6b2b] transition hover:bg-orange-100 active:translate-y-[1px]"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Qo'ng'iroq
                    </a>
                    <Link
                      href={`/usta/${m.id}`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#ff6b2b] text-[12px] font-bold text-white shadow-[0_3px_10px_rgba(255,107,43,0.28)] transition hover:bg-[#e85d20] active:translate-y-[1px]"
                    >
                      <Eye className="h-3.5 w-3.5" />
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
