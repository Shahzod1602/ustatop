import Link from "next/link"
import { Search, Star, ChevronRight, UserCircle2, Sparkles, ShieldCheck, Clock3, CheckCircle2, ArrowRight, Zap } from "lucide-react"
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

const AVATAR_PALETTES = [
  { bg: "#e8f4fd", text: "#1a6fa8" },
  { bg: "#e8f7ee", text: "#1a7a3f" },
  { bg: "#fde8e8", text: "#b01c1c" },
  { bg: "#f0e8fd", text: "#6b1aa8" },
  { bg: "#fdf4e8", text: "#a86b1a" },
  { bg: "#e8f0fd", text: "#1a3fa8" },
]

function avatarPalette(name: string) {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length]
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
    <div className="min-h-screen bg-[#f0ede8] pb-4 text-[#1a1a1a]">

      {/* Hero Header */}
      <header className="relative overflow-hidden bg-[#1a1a2e] px-4 pt-safe pb-6">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-[#ff6b2b]/15" />
        <div className="pointer-events-none absolute right-6 top-20 h-14 w-14 rounded-full bg-[#ff6b2b]/10" />
        <div className="pointer-events-none absolute -left-4 bottom-0 h-20 w-20 rounded-full bg-white/4" />

        {/* Top bar */}
        <div className="relative mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff6b2b] text-[17px] font-black text-white shadow-[0_4px_16px_rgba(255,107,43,0.45)]">
              U
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">Uy xizmati</p>
              <p className="text-[21px] font-black leading-none tracking-tight text-white">UstaTop</p>
            </div>
          </div>
          <Link
            href="/account"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition hover:bg-white/20"
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
        </div>

        {/* Headline */}
        <div className="relative mb-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff6b2b]">
            Ishonchli xizmat
          </p>
          <h1 className="text-[26px] font-black leading-[1.15] tracking-tight text-white">
            Usta toping —<br />
            <span className="text-[#ff6b2b]">tez va ishonchli</span>
          </h1>
        </div>

        {/* Trust pills */}
        <div className="relative mb-5 flex gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <ShieldCheck className="h-3 w-3 text-[#ff6b2b]" />
            Tekshirilgan
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <Zap className="h-3 w-3 text-[#ff6b2b]" />
            24/7 javob
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <Star className="h-3 w-3 fill-[#f59e0b] text-[#f59e0b]" />
            Top sifat
          </span>
        </div>

        {/* Search bar */}
        <Link
          href="/categories"
          className="relative flex h-12 items-center gap-3 rounded-2xl bg-white px-4 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
        >
          <Search className="h-4 w-4 shrink-0 text-[#ff6b2b]" />
          <span className="flex-1 text-sm text-[#9a9a9a]">Santexnik, elektrik, ta'mirchi...</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ff6b2b] shadow-[0_2px_8px_rgba(255,107,43,0.4)]">
            <ArrowRight className="h-3.5 w-3.5 text-white" />
          </div>
        </Link>
      </header>

      {/* Stats bar */}
      <div className="mx-3 mt-3 mb-3 grid grid-cols-3 gap-2">
        {[
          { value: "500+", label: "Usta" },
          { value: "10K+", label: "Xizmat" },
          { value: "4.8★", label: "O'rtacha" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#e0d8d0] bg-white px-3 py-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[15px] font-black text-[#ff6b2b]">{stat.value}</p>
            <p className="text-[10px] font-semibold text-[#8c8c8c]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <section className="fade-up mx-3 mb-3 rounded-2xl border border-[#e0d8d0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[17px] font-black text-[#1a1a1a]">Xizmat tanlang</p>
            <p className="text-[11px] text-[#8c8c8c]">Bir necha qadamda muammoni yuboring</p>
          </div>
          <Link href="/categories" className="flex items-center gap-0.5 text-[11px] font-bold text-[#ff6b2b]">
            Barchasi <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/request?category=${cat.slug}`}
              className="group flex items-center gap-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-3 py-2.5 transition-all hover:border-[#ff6b2b]/30 hover:bg-orange-50 hover:shadow-[0_4px_12px_rgba(255,107,43,0.1)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-[0_2px_6px_rgba(0,0,0,0.07)]">
                {cat.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-[#1a1a1a] transition-colors group-hover:text-[#ff6b2b]">
                  {cat.nameUz}
                </p>
                <p className="text-[10px] text-[#8c8c8c]">{cat._count.masters} usta</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <Link
            href="/request"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6b2b] text-sm font-bold text-white shadow-[0_4px_14px_rgba(255,107,43,0.32)] transition hover:bg-[#e85d20] active:translate-y-[1px]"
          >
            <Sparkles className="h-4 w-4" />
            Xizmat so'rovi yuborish
          </Link>
          <Link
            href="/my-requests"
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ff6b2b]/25 bg-orange-50 text-sm font-bold text-[#ff6b2b] transition hover:bg-orange-100 active:translate-y-[1px]"
          >
            Mening so'rovlarim
          </Link>
        </div>
      </section>

      {/* Top Masters */}
      <section className="fade-up stagger-1 mx-3 rounded-2xl border border-[#e0d8d0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[17px] font-black text-[#1a1a1a]">Top ustalar</p>
            <p className="text-[11px] text-[#8c8c8c]">Eng yuqori reytingli mutaxassislar</p>
          </div>
          <Link href="/ustalar" className="flex items-center gap-0.5 text-[11px] font-bold text-[#ff6b2b]">
            Barchasi <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {masters.length === 0 && (
            <p className="rounded-xl bg-[#faf8f5] p-4 text-center text-sm text-[#8c8c8c]">
              Yuklanmoqda...
            </p>
          )}
          {masters.map((m, i) => {
            const palette = avatarPalette(m.fullName)
            return (
              <Link
                key={m.id}
                href={`/usta/${m.id}`}
                className="group flex items-center gap-3 rounded-xl border border-[#ede8e0] bg-[#faf8f5] p-2.5 transition-all hover:border-[#ff6b2b]/25 hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)]"
              >
                {/* Avatar with rank */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black"
                    style={{ background: palette.bg, color: palette.text }}
                  >
                    {initials(m.fullName)}
                  </div>
                  {i < 3 && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff6b2b] text-[9px] font-black text-white shadow-sm">
                      {i + 1}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-[13px] font-black text-[#1a1a1a]">{m.fullName}</p>
                    {m.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8c8c8c]">
                    {m.categories[0]?.category.nameUz ?? "Usta"} · {m.serviceArea}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Clock3 className="h-3 w-3 text-[#ff6b2b]" />
                    <span className="text-[10px] font-semibold text-[#ff6b2b]">Tez javob</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                    <span className="text-[13px] font-black text-[#1a1a1a]">{m.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-[#8c8c8c]">{m.reviewCount} sharh</p>
                  <ChevronRight className="ml-auto mt-1 h-3.5 w-3.5 text-[#c0c0c0] transition-colors group-hover:text-[#ff6b2b]" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
