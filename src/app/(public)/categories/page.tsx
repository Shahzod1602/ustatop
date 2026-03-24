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
    <div className="min-h-screen bg-[#0e1420] text-slate-100">
      <header className="border-b border-white/10 bg-[#141a27] px-4 pb-3 pt-safe pt-5">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold">Barcha ruknlar</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <p className="mb-3 text-sm font-medium text-slate-400">Kerakli xizmat turini tanlang</p>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#141b2a] p-4 text-sm text-slate-400">Kategoriyalar topilmadi.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat: (typeof categories)[number]) => (
              <Link
                key={cat.id}
                href={`/request?category=${cat.slug}`}
                className="rounded-xl border border-white/10 bg-[#141b2a] p-3 text-center transition hover:border-[#69d2d6]/45"
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
