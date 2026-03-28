import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Kategoriyalar" }
export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { masters: true } } },
  })

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-4 text-[#3a3a3a]">
      <header className="bg-[#ff6b2b] px-3 pt-safe pb-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl bg-white/20 p-2 text-white hover:bg-white/30">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Barcha ruknlar</h1>
            <p className="text-xs text-white/70">Kerakli xizmat turini tanlang</p>
          </div>
        </div>
      </header>

      <section className="surface-card fade-up mx-3 mt-3 p-3.5">
        {categories.length === 0 ? (
          <p className="rounded-xl border border-[#e9e9e9] bg-[#f5f5f5] p-4 text-sm text-[#8c8c8c]">
            Kategoriyalar topilmadi.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/request?category=${cat.slug}`}
                className="surface-card-soft flex flex-col items-center rounded-xl p-3 text-center transition hover:border-[#ff6b2b]/40 hover:shadow-[0_2px_8px_rgba(255,107,43,0.08)]"
              >
                <div className="mb-2 text-2xl">{cat.icon}</div>
                <p className="line-clamp-2 text-xs font-bold text-[#3a3a3a]">{cat.nameUz}</p>
                <p className="mt-1 text-[11px] text-[#8c8c8c]">{cat._count.masters} usta</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          Muammoni batafsil yozsangiz, mos usta tezroq topiladi.
        </div>
      </section>
    </div>
  )
}
