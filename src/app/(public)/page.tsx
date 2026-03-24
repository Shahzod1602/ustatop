import Link from "next/link"
import { Search, Mail, Star, ChevronRight, UserCircle2, Sparkles, ShieldCheck } from "lucide-react"
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
      select: {
        id: true,
        fullName: true,
        rating: true,
        reviewCount: true,
        serviceArea: true,
        isVerified: true,
        categories: { include: { category: true }, take: 1 },
      },
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
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card mb-3 px-4 pb-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(140deg,#88edf1_0%,#59bfcf_100%)] text-base font-black text-[#08131b]">
              U
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mini App</p>
              <p className="text-[28px] leading-none heading-gradient">UstaTop</p>
            </div>
          </div>
          <button className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-300 transition hover:text-slate-100">
            <Mail className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="chip"><Sparkles className="mr-1 h-3 w-3" />24/7 so'rov</span>
          <span className="chip"><ShieldCheck className="mr-1 h-3 w-3" />Tekshirilgan ustalar</span>
        </div>

        <Link
          href="/account"
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
        >
          <UserCircle2 className="h-4 w-4" />
          Account
        </Link>

        <div className="rounded-xl border border-white/10 bg-[#101826] px-3 py-2 text-slate-400">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Xizmat turini qidiring...</span>
          </div>
        </div>
      </header>

      <section className="surface-card mb-3 p-3.5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[30px] font-extrabold leading-none heading-gradient">Salom!</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Muammoni yozing, mos ustani topamiz.</p>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-[linear-gradient(140deg,#8beaf0_0%,#f2c75a_100%)]" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/request?category=${cat.slug}`}
              className="rounded-xl border border-white/10 bg-[#0f1623] px-2 py-3 text-center transition hover:border-[#89e8ed]/45"
            >
              <div className="mb-1 text-xl leading-none">{cat.icon}</div>
              <p className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-200">{cat.nameUz}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{cat._count.masters} usta</p>
            </Link>
          ))}
        </div>

        <Link href="/request" className="action-amber mt-3 block text-center text-sm">
          Xizmat so'rovi yuborish
        </Link>
        <Link href="/my-requests" className="action-primary mt-2 block text-center text-sm">
          Mening so'rovlarim
        </Link>
      </section>

      <section className="surface-card p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm font-extrabold text-slate-100">Top ustalar</p>
          <Link href="/ustalar" className="text-xs font-semibold text-[#89e8ed]">
            Barchasi
          </Link>
        </div>

        <div className="space-y-2">
          {masters.map((m) => (
            <Link
              key={m.id}
              href={`/ustalar?masterId=${m.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101726] p-2.5 transition hover:border-[#89e8ed]/35"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#153044] text-sm font-bold text-[#8ce7eb]">
                {initials(m.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-100">{m.fullName}</p>
                <p className="truncate text-xs font-medium text-slate-400">
                  {m.categories[0]?.category.nameUz ?? "Usta"} · {m.serviceArea}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-extrabold text-slate-100">
                  <Star className="h-4 w-4 fill-[#f4c95f] text-[#f4c95f]" />
                  {m.rating.toFixed(1)}
                </div>
                <p className="text-[11px] text-slate-500">{m.reviewCount} sharh</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
