import Link from "next/link"
import { ArrowLeft, Star, CheckCircle2, MapPin, Filter, Phone, Eye, Users } from "lucide-react"
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
  { bg: "#143549", text: "#8de7ec" },
  { bg: "#1a3020", text: "#86efac" },
  { bg: "#2d1818", text: "#fca5a5" },
  { bg: "#1e1835", text: "#c4b5fd" },
  { bg: "#2a1e08", text: "#fcd34d" },
  { bg: "#0f2a3a", text: "#93c5fd" },
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
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card fade-up mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg">Ustalar ro'yxati</h1>
            <p className="text-xs text-slate-400">Mos ustani reyting va tajriba bo'yicha tanlang</p>
          </div>
        </div>
      </header>

      <div className="surface-card fade-up stagger-1 mb-3 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-extrabold text-slate-100">
            <span className="text-[#89e8ed]">{masters.length}</span> ta usta topildi
          </p>
          <Link href="/ustalar" className="chip">
            <Filter className="mr-1 h-3 w-3" />
            Tozalash
          </Link>
        </div>

        <form className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Usta nomi..."
            className="h-10 rounded-xl border border-white/10 bg-[#111928] px-3 text-sm text-slate-100 outline-none focus:border-[#89e8ed]"
          />
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Shahar..."
            className="h-10 rounded-xl border border-white/10 bg-[#111928] px-3 text-sm text-slate-100 outline-none focus:border-[#89e8ed]"
          />
          <button className="action-primary h-10 px-3 py-0 text-sm">Qidirish</button>
        </form>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold">
          <Link
            href={`/ustalar${requestId ? `?requestId=${requestId}` : ""}`}
            className={`rounded-xl border px-2 py-2 text-center ${!city && !minRating && !sort ? "border-[#89e8ed]/40 bg-[#123245] text-[#8ce7eb]" : "border-white/10 bg-[#111928] text-slate-400"}`}
          >
            Barchasi
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}minRating=4.5`}
            className={`rounded-xl border px-2 py-2 text-center ${minRating && minRating >= 4.5 ? "border-[#89e8ed]/40 bg-[#123245] text-[#8ce7eb]" : "border-white/10 bg-[#111928] text-slate-400"}`}
          >
            Reyting 4.5+
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}sort=new`}
            className={`rounded-xl border px-2 py-2 text-center ${sort === "new" ? "border-[#89e8ed]/40 bg-[#123245] text-[#8ce7eb]" : "border-white/10 bg-[#111928] text-slate-400"}`}
          >
            Yangi
          </Link>
        </div>
      </div>

      <div className="space-y-3 fade-up stagger-2">
        {masters.length === 0 && (
          <div className="surface-card p-6 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm font-bold text-slate-300">Usta topilmadi</p>
            <p className="mt-1 text-xs text-slate-500">Filtrni o'zgartirib ko'ring</p>
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
                  <p className="truncate text-[17px] font-extrabold text-slate-100">{m.fullName}</p>
                  {m.isVerified && (
                    <span className="status-pill border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Tasdiqlangan
                    </span>
                  )}
                </div>

                <div className="mb-1 flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[#f6b627] text-[#f6b627]" />
                  <span className="text-sm font-bold text-slate-100">{m.rating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">({m.reviewCount} sharh)</span>
                </div>

                <p className="text-sm font-semibold text-slate-300">
                  {yearsActive(m.createdAt)} · {extractPrice(m.bio)}
                </p>

                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {m.serviceArea} · {m.categories[0]?.category.nameUz ?? "Usta"}
                </div>

                {m._count.posts > 0 && (
                  <p className="mt-1 text-xs text-slate-500">{m._count.posts} ta ish namunasi</p>
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
