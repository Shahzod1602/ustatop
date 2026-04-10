import Link from "next/link"
import { Star, MapPin, Users, SlidersHorizontal, LayoutGrid, Bookmark } from "lucide-react"
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
      categories: { include: { category: true }, take: 3 },
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
          categories: { include: { category: true }, take: 3 },
          _count: { select: { posts: true } },
        },
      })
    }
  }

  if (masterId) {
    masters = masters.filter((m) => m.id === masterId)
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 text-[#1a1a1a]">

      {/* Header */}
      <header className="px-5 pt-safe pb-2 pt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#ff6b2b]">Katalog</p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight text-[#1a1a1a]">
          Eng sara ustalar sizning xizmatingizda
        </h1>
        <p className="mt-1 text-sm text-[#8c8c8c]">
          <span className="font-bold text-[#ff6b2b]">{masters.length}</span> ta usta topildi
        </p>
      </header>

      {/* Search (hidden form) */}
      <form className="px-5 pt-3">
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Usta nomi..."
            className="h-11 flex-1 rounded-full border border-[#e8e4de] bg-white px-4 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b0a8a0] focus:border-[#ff6b2b] transition-colors shadow-sm"
          />
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Shahar..."
            className="h-11 w-28 rounded-full border border-[#e8e4de] bg-white px-4 text-sm text-[#1a1a1a] outline-none placeholder:text-[#b0a8a0] focus:border-[#ff6b2b] transition-colors shadow-sm"
          />
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff6b2b] text-white shadow-[0_4px_12px_rgba(255,107,43,0.3)] transition hover:bg-[#e85d20] active:scale-95">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Filter Chips */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
        {[
          { label: "Kategoriya", icon: <LayoutGrid className="h-3.5 w-3.5" />, href: `/ustalar${requestId ? `?requestId=${requestId}` : ""}`, active: !city && !minRating && !sort },
          { label: "Shahar", icon: <MapPin className="h-3.5 w-3.5" />, href: `/ustalar?${requestId ? `requestId=${requestId}&` : ""}city=Toshkent`, active: !!city },
          { label: "Reyting", icon: <Star className="h-3.5 w-3.5" />, href: `/ustalar?${requestId ? `requestId=${requestId}&` : ""}minRating=4.5`, active: !!(minRating && minRating >= 4.5) },
          { label: "Yangi", icon: null, href: `/ustalar?${requestId ? `requestId=${requestId}&` : ""}sort=new`, active: sort === "new" },
        ].map(({ label, icon, href, active }) => (
          <Link
            key={label}
            href={href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
              active
                ? "border-[#ff6b2b] bg-[#ff6b2b]/10 text-[#ff6b2b]"
                : "border-[#e0dbd4] bg-white text-[#6a6460] hover:border-[#ff6b2b]/40 hover:text-[#ff6b2b]"
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}

        {(q || city || minRating || sort) && (
          <Link
            href="/ustalar"
            className="inline-flex shrink-0 items-center rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-500 transition hover:bg-red-100"
          >
            Tozalash
          </Link>
        )}
      </div>

      {/* Masters List */}
      <div className="mt-4 space-y-3 px-5">
        {masters.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f2ee]">
              <Users className="h-8 w-8 text-[#c0b8b0]" />
            </div>
            <p className="text-[17px] font-extrabold text-[#1a1a1a]">Usta topilmadi</p>
            <p className="mt-1 text-sm text-[#8c8c8c]">Filtrni o&apos;zgartirib ko&apos;ring</p>
            <Link
              href="/ustalar"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#ff6b2b] px-6 text-sm font-bold text-white shadow-[0_4px_14px_rgba(255,107,43,0.3)] transition hover:bg-[#e85d20]"
            >
              Barcha ustalar
            </Link>
          </div>
        )}

        {masters.map((m) => {
          const palette = avatarPalette(m.fullName)
          return (
            <Link key={m.id} href={`/usta/${m.id}`} className="block">
              <article className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div
                    className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-xl text-lg font-extrabold overflow-hidden"
                    style={{ background: palette.bg, color: palette.text }}
                  >
                    {m.profilePhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.profilePhoto} alt={m.fullName} className="h-full w-full object-cover" />
                    ) : (
                      initials(m.fullName)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Name + Badge */}
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[16px] font-extrabold text-[#1a1a1a]">{m.fullName}</p>
                      {m.isVerified && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          ELITE
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                      <span className="text-[13px] font-bold text-[#1a1a1a]">{m.rating.toFixed(1)}</span>
                      <span className="text-[12px] text-[#8c8c8c]">({m.reviewCount} sharh)</span>
                    </div>

                    {/* Location */}
                    <div className="mt-1.5 flex items-center gap-1 text-[12px] text-[#8c8c8c]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#b0a8a0]" />
                      <span className="truncate">{m.serviceArea}</span>
                    </div>

                    {/* Category badges */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.categories.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full border border-[#e0dbd4] px-2.5 py-0.5 text-[11px] font-medium text-[#6a6460]"
                        >
                          {c.category.nameUz}
                        </span>
                      ))}
                      {m.categories.length === 0 && (
                        <span className="rounded-full border border-[#e0dbd4] px-2.5 py-0.5 text-[11px] font-medium text-[#6a6460]">
                          {yearsActive(m.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#ff6b2b] text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(255,107,43,0.25)]"
                  >
                    Bog&apos;lanish
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e0dbd4] bg-white text-[#8c8c8c]">
                    <Bookmark className="h-4 w-4" />
                  </span>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
