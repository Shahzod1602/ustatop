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
    masters = masters.filter((m) => m.id === masterId)
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <header className="bg-[#1d57b8] px-4 pb-3 pt-safe pt-5 text-white">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg p-1.5 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold">Ustalarni Topish</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <p className="mb-3 text-lg font-extrabold text-[#1f3252]">{masters.length} ta ustalar topildi</p>

        <form className="mb-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-3">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Usta nomi..."
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#1d57b8]"
          />
          <input
            name="city"
            defaultValue={city ?? ""}
            placeholder="Shahar / lokatsiya..."
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#1d57b8]"
          />
          <button className="h-10 rounded-lg bg-[#1d57b8] text-sm font-bold text-white">Qidirish</button>
        </form>

        <div className="mb-3 grid grid-cols-3 gap-2 text-xs font-bold">
          <Link
            href={`/ustalar${requestId ? `?requestId=${requestId}` : ""}`}
            className={`rounded-lg border px-2 py-2 text-center ${!city && !minRating && !sort ? "border-[#1d57b8] bg-[#e9f1ff] text-[#1d57b8]" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Barchasi
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}minRating=4.5`}
            className={`rounded-lg border px-2 py-2 text-center ${minRating && minRating >= 4.5 ? "border-[#1d57b8] bg-[#e9f1ff] text-[#1d57b8]" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Reyting 4.5+
          </Link>
          <Link
            href={`/ustalar?${requestId ? `requestId=${requestId}&` : ""}sort=new`}
            className={`rounded-lg border px-2 py-2 text-center ${sort === "new" ? "border-[#1d57b8] bg-[#e9f1ff] text-[#1d57b8]" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Yangi
          </Link>
        </div>

        <div className="space-y-3">
          {masters.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#dbeafe] text-lg font-bold text-[#1d57b8]">
                  {m.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.profilePhoto} alt={m.fullName} className="h-20 w-20 rounded-xl object-cover" />
                  ) : (
                    initials(m.fullName)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-extrabold text-[#1b4f9d]">{m.fullName}</p>
                  <div className="my-0.5 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(m.rating) ? "fill-[#f6b627] text-[#f6b627]" : "text-slate-300"}`} />
                    ))}
                    <span className="ml-1 text-sm font-bold text-[#1f3252]">{m.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">
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
                    className="block rounded-lg bg-[linear-gradient(180deg,#ffcb45_0%,#f4b52c_100%)] px-4 py-2 text-center text-sm font-extrabold text-[#163a70]"
                  >
                    Qo'ng'iroq
                  </a>
                  <Link
                    href={`/usta/${m.id}`}
                    className="block rounded-lg border border-[#1d57b8]/30 px-3 py-1.5 text-center text-xs font-bold text-[#1d57b8]"
                  >
                    Profil
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 h-28 rounded-2xl bg-[linear-gradient(135deg,#dbeafe_0%,#bfdbfe_35%,#e2e8f0_100%)] p-3">
          <div className="h-full rounded-xl border border-white/80 bg-white/50" />
        </div>
      </div>
    </div>
  )
}
