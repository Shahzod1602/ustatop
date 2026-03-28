import Link from "next/link"
import { Search, Star, ChevronRight, UserCircle2, Sparkles, ShieldCheck, Clock3, CheckCircle2 } from "lucide-react"
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
    <div className="min-h-screen bg-[#f5f5f5] pb-4 text-[#3a3a3a]">

      {/* Orange Header */}
      <header className="bg-[#ff6b2b] px-4 pt-safe pb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-base font-black text-white">
              U
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Uy xizmati</p>
              <p className="text-[22px] font-extrabold leading-none text-white">UstaTop</p>
            </div>
          </div>
          <Link
            href="/account"
            className="flex h-9 items-center gap-1.5 rounded-full bg-white/20 px-3 text-xs font-semibold text-white hover:bg-white/30"
          >
            <UserCircle2 className="h-4 w-4" />
            Account
          </Link>
        </div>

        <div className="mb-3 flex gap-4 text-xs text-white/80">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> 24/7 so'rov
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Tekshirilgan ustalar
          </span>
        </div>

        {/* Search bar */}
        <Link href="/categories" className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-[#8c8c8c]" />
          <span className="text-sm text-[#8c8c8c]">Santexnik, elektrik yoki boshqa xizmat...</span>
        </Link>
      </header>

      {/* Categories */}
      <section className="surface-card fade-up mx-3 mb-3 mt-3 p-3.5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold text-[#3a3a3a]">Xizmat toping</p>
            <p className="mt-0.5 text-xs font-medium text-[#8c8c8c]">Bir necha qadamda muammoni yuboring.</p>
          </div>
          <Link href="/categories" className="text-xs font-semibold text-[#ff6b2b]">
            Barchasi
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/request?category=${cat.slug}`}
              className="surface-card-soft flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:border-[#ff6b2b]/40 hover:shadow-[0_2px_8px_rgba(255,107,43,0.08)]"
            >
              <span className="shrink-0 text-2xl leading-none">{cat.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#3a3a3a]">{cat.nameUz}</p>
                <p className="text-[11px] text-[#8c8c8c]">{cat._count.masters} usta</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <Link href="/request" className="action-primary block text-center text-sm">
            Xizmat so'rovi yuborish
          </Link>
          <Link href="/my-requests" className="action-amber block text-center text-sm">
            Mening so'rovlarim
          </Link>
        </div>
      </section>

      {/* Top Masters */}
      <section className="surface-card fade-up stagger-1 mx-3 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <p className="section-title">Top ustalar</p>
          <Link href="/ustalar" className="text-xs font-semibold text-[#ff6b2b]">
            Barchasi
          </Link>
        </div>

        <div className="space-y-2">
          {masters.length === 0 && (
            <p className="surface-card-soft rounded-xl p-3 text-sm text-[#8c8c8c]">Ustalar yuklanmoqda...</p>
          )}
          {masters.map((m) => {
            const palette = avatarPalette(m.fullName)
            return (
              <Link
                key={m.id}
                href={`/usta/${m.id}`}
                className="flex items-center gap-3 rounded-xl border border-[#e9e9e9] bg-white p-2.5 transition hover:border-[#ff6b2b]/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ background: palette.bg, color: palette.text }}
                >
                  {initials(m.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#3a3a3a]">{m.fullName}</p>
                  <p className="truncate text-xs font-medium text-[#8c8c8c]">
                    {m.categories[0]?.category.nameUz ?? "Usta"} · {m.serviceArea}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    {m.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Tasdiqlangan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#e9e9e9] bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-semibold text-[#8c8c8c]">
                        Faol
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[#8c8c8c]">
                      <Clock3 className="h-3 w-3" />
                      Tez javob
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-extrabold text-[#3a3a3a]">
                    <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
                    {m.rating.toFixed(1)}
                  </div>
                  <p className="text-[11px] text-[#8c8c8c]">{m.reviewCount} sharh</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#c0c0c0]" />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
