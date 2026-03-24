import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
      <header className="surface-card mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg">Barcha ruknlar</h1>
        </div>
      </header>

      <div className="surface-card p-3.5">
        <p className="mb-3 text-sm font-medium text-slate-400">Kerakli xizmat turini tanlang</p>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#111928] p-4 text-sm text-slate-400">Kategoriyalar topilmadi.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/request?category=${cat.slug}`}
                className="rounded-xl border border-white/10 bg-[#111928] p-3 text-center transition hover:border-[#89e8ed]/45"
              >
                <div className="mb-2 text-2xl">{cat.icon}</div>
                <p className="line-clamp-2 text-xs font-bold text-slate-200">{cat.nameUz}</p>
                <p className="mt-1 text-[11px] text-slate-500">{cat._count.masters} usta</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
