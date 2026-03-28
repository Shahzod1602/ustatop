import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Star, ShieldCheck, BadgeCheck } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const AVATAR_PALETTES = [
  { bg: "#143549", text: "#8de7ec" },
  { bg: "#1a3020", text: "#86efac" },
  { bg: "#2d1818", text: "#fca5a5" },
  { bg: "#1e1835", text: "#c4b5fd" },
  { bg: "#2a1e08", text: "#fcd34d" },
  { bg: "#0f2a3a", text: "#93c5fd" },
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

export default async function MasterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const master = await prisma.master.findUnique({
    where: { id, isActive: true },
    include: {
      categories: { include: { category: { select: { nameUz: true, icon: true } } } },
      posts: { orderBy: { createdAt: "desc" }, take: 20 },
      reviews: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, rating: true, comment: true } },
    },
  })

  if (!master) {
    return (
      <div className="p-4 text-sm text-slate-300">
        <Link href="/ustalar" className="text-[#89e8ed] underline">
          Orqaga
        </Link>
        <p className="mt-2">Usta topilmadi.</p>
      </div>
    )
  }

  const palette = avatarPalette(master.fullName)

  return (
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card fade-up mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/ustalar" className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg">Usta profili</h1>
            <p className="text-xs text-slate-400">Ishonch va tajribani ko'ring</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 fade-up stagger-1">
        <section className="surface-card p-3.5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold"
              style={{ background: palette.bg, color: palette.text }}
            >
              {master.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={master.profilePhoto} alt={master.fullName} className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                initials(master.fullName)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-slate-100">{master.fullName}</p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="status-pill border-amber-500/25 bg-amber-500/10 text-amber-200">
                  <Star className="h-3 w-3 fill-current" />
                  {master.rating.toFixed(1)} reyting
                </span>
                <span className="status-pill border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  {master.isVerified ? "Tasdiqlangan" : "Faol usta"}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {master.serviceArea}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {master.categories.map((c) => (
              <span key={c.id} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-medium text-slate-200">
                {c.category.icon} {c.category.nameUz}
              </span>
            ))}
          </div>

          {master.bio && <p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm text-slate-300">{master.bio}</p>}

          <div className="mt-3 grid grid-cols-1 gap-2">
            <a href={`tel:${master.phone}`} className="action-amber inline-flex h-11 items-center justify-center gap-1 text-sm">
              <Phone className="h-4 w-4" />
              Qo'ng'iroq qilish
            </a>
          </div>
        </section>

        <section className="surface-card p-3.5">
          <h2 className="mb-2 section-title">Ish postlari</h2>
          <div className="space-y-2.5">
            {master.posts.length === 0 && (
              <div className="surface-card-soft rounded-2xl p-3 text-sm text-slate-400">Hozircha ish postlari yo'q.</div>
            )}

            {master.posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#101826]">
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt={post.title} className="h-40 w-full object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-100">{post.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{post.content}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card p-3.5">
          <h2 className="mb-2 section-title">Sharhlar</h2>
          <div className="space-y-2">
            {master.reviews.length === 0 && (
              <div className="surface-card-soft rounded-2xl p-3 text-sm text-slate-400">Hozircha sharhlar yo'q.</div>
            )}

            {master.reviews.map((review) => (
              <article key={review.id} className="surface-card-soft rounded-2xl p-3">
                <div className="mb-1 inline-flex items-center gap-1 text-amber-300">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-sm font-bold">{review.rating}/5</span>
                </div>
                <p className="text-sm text-slate-300">{review.comment || "Izoh qoldirilmagan"}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
