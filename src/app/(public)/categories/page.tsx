import type { Metadata } from "next"
import Link from "next/link"
import { Search, ChevronRight, Wrench } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Kategoriyalar" }
export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { masters: true } } },
  })

  // Pick the featured category: the one with the most masters
  const sorted = [...categories].sort(
    (a, b) => b._count.masters - a._count.masters,
  )
  const featured = sorted[0] ?? null
  const rest = categories.filter((c) => c.id !== featured?.id)

  // Split rest into grid cards (first 6) and list items (remaining)
  const gridCards = rest.slice(0, 6)
  const listItems = rest.slice(6)

  return (
    <div className="min-h-screen bg-[#f0ede8] pb-24 text-[#3a3a3a]">
      {/* Header */}
      <header className="bg-white px-4 pt-safe pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xl font-extrabold text-[#ff6b2b] tracking-tight">
            UstaTanla
          </span>
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 text-[#3a3a3a] hover:bg-[#f5f3f0] transition">
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/kabinet"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6b2b] text-white text-sm font-bold"
            >
              U
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5">
        {/* Title */}
        <h1 className="text-2xl font-extrabold text-[#1a1a1a]">Xizmatlar</h1>
        <p className="mt-1 text-sm text-[#8c8c8c]">
          O&apos;zingizga kerakli usta turini tanlang
        </p>

        {/* Search bar */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0a99f]" />
          <input
            type="text"
            placeholder="Kategoriyani qidiring..."
            className="w-full rounded-full bg-[#f5f3f0] py-3 pl-11 pr-4 text-sm text-[#3a3a3a] placeholder-[#b0a99f] outline-none focus:ring-2 focus:ring-[#ff6b2b]/30 transition"
            readOnly
          />
        </div>

        {categories.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-[#8c8c8c] text-center">
            Kategoriyalar topilmadi.
          </p>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <Link
                href={`/request?category=${featured.slug}`}
                className="mt-5 block overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff6b2b] to-[#ff8f5a] p-5 text-white shadow-lg shadow-[#ff6b2b]/20 transition hover:shadow-xl hover:shadow-[#ff6b2b]/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                      Ommabop
                    </span>
                    <h2 className="mt-3 text-xl font-extrabold">
                      {featured.nameUz}
                    </h2>
                    <p className="mt-1 text-sm text-white/80">
                      {featured._count.masters}+ professional usta
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm">
                    {featured.icon || <Wrench className="h-7 w-7" />}
                  </div>
                </div>
              </Link>
            )}

            {/* Grid cards */}
            {gridCards.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {gridCards.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/request?category=${cat.slug}`}
                    className="flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f3f0] text-2xl">
                      {cat.icon}
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#1a1a1a] line-clamp-1">
                      {cat.nameUz}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8c8c8c]">
                      {cat._count.masters} usta
                    </p>
                  </Link>
                ))}
              </div>
            )}

            {/* List items */}
            {listItems.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
                {listItems.map((cat, i) => (
                  <Link
                    key={cat.id}
                    href={`/request?category=${cat.slug}`}
                    className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#f5f3f0] ${
                      i !== listItems.length - 1
                        ? "border-b border-[#f0ede8]"
                        : ""
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f3f0] text-xl">
                      {cat.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1a1a1a] truncate">
                        {cat.nameUz}
                      </p>
                      <p className="text-xs text-[#8c8c8c]">
                        {cat._count.masters} usta &middot;{" "}
                        <span className="text-[#ff6b2b] font-semibold uppercase text-[10px] tracking-wide">
                          yaqin orada
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#c0b9b0]" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
