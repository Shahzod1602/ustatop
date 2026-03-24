import Link from "next/link"
import { Search, Mail, Star, ChevronRight, UserCircle2 } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function getData() {
  const [categories, masters] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      take: 8,
      include: { _count: { select: { masters: true } } },
    }),
    prisma.master.findMany({
      where: { isActive: true },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      take: 5,
      select: { id: true, fullName: true, rating: true, reviewCount: true, serviceArea: true, categories: { include: { category: true }, take: 1 } },
    }),
  ])

  return { categories, masters }
}

function initials(fullName: string) {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export default async function HomePage() {
  const { categories, masters } = await getData()

  return (
    <div className="min-h-screen bg-[#0e1420] pb-4 text-slate-100">
      <header className="border-b border-white/10 bg-[#141a27] px-4 pb-4 pt-safe pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#69d2d6] text-center text-base font-black leading-8 text-[#0a1220]">U</div>
            <p className="text-[34px] font-bold leading-none tracking-tight text-slate-100">UstaTop</p>
          </div>
          <button className="rounded-full bg-white/10 p-2 text-slate-300">
            <Mail className="h-4 w-4" />
          </button>
        </div>
        <Link
          href="/account"
          className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
        >
          <UserCircle2 className="h-4 w-4" />
          Account
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#0f1624] px-3 py-2 text-slate-400">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Xizmatni qidiring...</span>
          </div>
        </div>
      </header>

      <section className="mx-3 mt-3 rounded-2xl border border-white/10 bg-[#141b2a] p-3 shadow-sm">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-[30px] font-extrabold text-slate-100">Salom!</p>
            <p className="text-sm font-semibold text-slate-400">Qanday muammo bor?</p>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-[linear-gradient(140deg,#69d2d6_0%,#3f8fc6_100%)]" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat: (typeof categories)[number]) => (
            <Link
              key={cat.id}
              href={`/request?category=${cat.slug}`}
              className="rounded-xl border border-white/10 bg-[#0f1624] px-2 py-3 text-center shadow-sm transition hover:border-[#69d2d6]/50"
            >
              <div className="mb-1 text-xl leading-none">{cat.icon}</div>
              <p className="text-xs font-bold leading-tight text-slate-200">{cat.nameUz}</p>
            </Link>
          ))}
        </div>

        <Link
          href="/request"
          className="mt-3 block rounded-xl bg-[linear-gradient(180deg,#bfa44d_0%,#9b8237_100%)] px-4 py-3 text-center text-base font-extrabold text-[#111827] shadow"
        >
          Xizmat so'rovi yuborish
        </Link>
        <Link
          href="/my-requests"
          className="mt-2 block rounded-xl border border-[#69d2d6]/35 bg-[#102233] px-4 py-2.5 text-center text-sm font-bold text-[#69d2d6]"
        >
          Mening so'rovlarim
        </Link>
      </section>

      <section className="mx-3 mt-3 rounded-2xl border border-white/10 bg-[#141b2a] p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-100">Populyar Ustalar</p>
          <Link href="/ustalar" className="text-xs font-semibold text-[#69d2d6]">
            Barchasi
          </Link>
        </div>

        <div className="space-y-2">
          {masters.map((m: (typeof masters)[number]) => (
            <Link
              key={m.id}
              href={`/ustalar?masterId=${m.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1624] p-2.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#16344c] text-sm font-bold text-[#8ce7eb]">
                {initials(m.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-100">{m.fullName}</p>
                <p className="truncate text-xs font-medium text-slate-400">
                  {m.categories[0]?.category.nameUz ?? "Usta"} · {m.serviceArea}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-extrabold text-slate-100">
                <Star className="h-4 w-4 fill-[#f6b627] text-[#f6b627]" />
                {m.rating.toFixed(1)}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
