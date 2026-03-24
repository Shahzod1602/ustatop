import Link from "next/link"
import { ArrowLeft, Star, CheckCircle2, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type Params = Promise<{
  requestId?: string
  masterId?: string
  city?: string
  minRating?: string
  sort?: string
  q?: string
}>

function initials(fullName: string) {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
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
          categories: { include: { category: true }, take: 1 },
          _count: { select: { posts: true } },
        },
      })
    }
  }

  if (masterId) {
    masters = masters.filter((m: (typeof masters)[number]) => m.id === masterId)
  }

  return (
    <div className="min-h-screen bg-[#0e1420] text-slate-100">
      <header className="border-b border-white/10 bg-[#141a27] px-4 pb-3 pt-safe pt-5">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold">Ustalarni Topish</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <p className="mb-3 text-lg font-extrabold text-slate-100">{masters.length} ta ustalar topildi</p>

        <form className="mb-3 grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-[#141b2a] p-2.5 sm:grid-cols-3">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Usta nomi..."
            className="h-10 rounded-lg border border-white/10 bg-[#0f1624] px-3 text-sm text-slate-100 outline-none focus:border-[#69d2d6]"
          />
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Shahar / lokatsiya..."
            className="h-10 rounded-lg border border-white/10 bg-[#0f1624] px-3 text-sm text-slate-100 outline-none focus:border-[#69d2d6]"
          />
          <button className="h-10 rounded-lg bg-[#69d2d6] text-sm font-bold text-[#0b1220]">Qidirish</button>
        </form>

        <div className="mb-3 grid grid-cols-3 gap-2 text-xs font-bold">
          <Link
            href={`/ustalar${requestId ? `?requestId=${requestId}` : ""}`}
            className={`rounded-lg border px-2 py-2 text-center ${!city && !minRating && !sort ? "border-[#69d2d6] bg-[#102233] text-[#69d2d6]" : "border-white/10 bg-[#141b2a] text-slate-400"}`}
          >
            Barchasi
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}minRating=4.5`}
            className={`rounded-lg border px-2 py-2 text-center ${minRating && minRating >= 4.5 ? "border-[#69d2d6] bg-[#102233] text-[#69d2d6]" : "border-white/10 bg-[#141b2a] text-slate-400"}`}
          >
            Reyting 4.5+
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}sort=new`}
            className={`rounded-lg border px-2 py-2 text-center ${sort === "new" ? "border-[#69d2d6] bg-[#102233] text-[#69d2d6]" : "border-white/10 bg-[#141b2a] text-slate-400"}`}
          >
            Yangi
          </Link>
        </div>

        <div className="space-y-3">
          {masters.map((m: (typeof masters)[number]) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-[#141b2a] p-2.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#16344c] text-lg font-bold text-[#8ce7eb]">
                  {m.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.profilePhoto} alt={m.fullName} className="h-20 w-20 rounded-xl object-cover" />
                  ) : (
                    initials(m.fullName)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-extrabold text-slate-100">{m.fullName}</p>
                  <div className="my-0.5 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(m.rating) ? "fill-[#f6b627] text-[#f6b627]" : "text-slate-300"}`} />
                    ))}
                    <span className="ml-1 text-sm font-bold text-slate-200">{m.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-400">
                    {Math.max(1, Math.round(m.reviewCount / 6))} yil tajriba · {extractPrice(m.bio)}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{m.isVerified ? "Tekshiruvdan o'tgan" : "Tezkor aloqa"}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {m.serviceArea} · {m.categories[0]?.category.nameUz ?? "Usta"}
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">Postlar: {m._count.posts}</p>
                </div>
                <div className="self-center space-y-1">
                  <a
                    href={`tel:${m.phone}`}
                    className="block rounded-lg bg-[linear-gradient(180deg,#bfa44d_0%,#9b8237_100%)] px-4 py-2 text-center text-sm font-extrabold text-[#111827]"
                  >
                    Qo'ng'iroq
                  </a>
                  <Link
                    href={`/usta/${m.id}`}
                    className="block rounded-lg border border-[#69d2d6]/35 px-3 py-1.5 text-center text-xs font-bold text-[#69d2d6]"
                  >
                    Profil
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 h-28 rounded-2xl bg-[linear-gradient(135deg,#1d2a3f_0%,#16344c_45%,#102233_100%)] p-3">
          <div className="h-full rounded-xl border border-white/10 bg-black/20" />
        </div>
      </div>
    </div>
  )
}
