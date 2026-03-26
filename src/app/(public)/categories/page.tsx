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
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card fade-up mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg">Barcha ruknlar</h1>
            <p className="text-xs text-slate-400">Kerakli xizmat turini tanlang</p>
          </div>
        </div>
      </header>

      <section className="surface-card fade-up stagger-1 p-3.5">
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#111928] p-4 text-sm text-slate-400">Kategoriyalar topilmadi.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/request?category=${cat.slug}`}
                className="surface-card-soft rounded-2xl p-3 text-center transition hover:border-[#89e8ed]/45"
              >
                <div className="mb-2 text-2xl">{cat.icon}</div>
                <p className="line-clamp-2 text-xs font-bold text-slate-200">{cat.nameUz}</p>
                <p className="mt-1 text-[11px] text-slate-500">{cat._count.masters} usta</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          <Sparkles className="mr-1 inline h-3.5 w-3.5" />
          Muammoni batafsil yozsangiz, mos usta tezroq topiladi.
        </div>
      </section>
    </div>
  )
}
