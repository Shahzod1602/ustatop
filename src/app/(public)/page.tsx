import Link from "next/link"
import { Search, Star, ChevronRight, UserCircle2, Sparkles, ShieldCheck, Clock3 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ThemeVariantToggle } from "@/components/shared/theme-variant-toggle"

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
      <header className="surface-card fade-up mb-3 px-4 pb-4 pt-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(145deg,#89edf1_0%,#58bac8_100%)] text-base font-black text-[#08131b]">
              U
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Uy xizmati</p>
              <p className="text-[28px] leading-none heading-gradient">UstaTop</p>
            </div>
          </div>
          <ThemeVariantToggle />
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <span className="chip justify-center">
            <Sparkles className="mr-1 h-3 w-3" /> 24/7 so'rov
          </span>
          <span className="chip justify-center">
            <ShieldCheck className="mr-1 h-3 w-3" /> Tekshirilgan ustalar
          </span>
        </div>

        <div className="surface-card-soft rounded-2xl px-3 py-2.5 text-slate-300">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="text-sm font-semibold">Santexnik, elektrik yoki boshqa xizmatni tanlang</span>
          </div>
        </div>
      </header>

      <section className="surface-card fade-up stagger-1 mb-3 p-3.5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[30px] font-extrabold leading-none heading-gradient">Xizmat toping</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Bir necha qadamda muammoni yuboring.</p>
          </div>
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-slate-200"
          >
            <UserCircle2 className="h-4 w-4" />
            Account
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/request?category=${cat.slug}`}
              className="surface-card-soft rounded-2xl px-2 py-3 text-center transition hover:border-[#89e8ed]/45"
            >
              <div className="mb-1 text-xl leading-none">{cat.icon}</div>
              <p className="line-clamp-2 text-[11px] font-bold leading-tight text-slate-200">{cat.nameUz}</p>
              <p className="mt-1 text-[10px] text-slate-500">{cat._count.masters} usta</p>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <Link href="/request" className="action-amber block text-center text-sm">
            Xizmat so'rovi yuborish
          </Link>
          <Link href="/my-requests" className="action-primary block text-center text-sm">
            Mening so'rovlarim
          </Link>
        </div>
      </section>

      <section className="surface-card fade-up stagger-2 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <p className="section-title">Top ustalar</p>
          <Link href="/ustalar" className="text-xs font-semibold text-[#89e8ed]">
            Barchasi
          </Link>
        </div>

        <div className="space-y-2.5">
          {masters.map((m) => (
            <Link
              key={m.id}
              href={`/usta/${m.id}`}
              className="surface-card-soft flex items-center gap-3 rounded-2xl p-2.5 transition hover:border-[#89e8ed]/35"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#143549] text-sm font-bold text-[#8de7ec]">
                {initials(m.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-100">{m.fullName}</p>
                <p className="truncate text-xs font-medium text-slate-400">
                  {m.categories[0]?.category.nameUz ?? "Usta"} · {m.serviceArea}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <span className="status-pill border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    {m.isVerified ? "Verified" : "Faol"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    Tez javob
                  </span>
                </div>
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
