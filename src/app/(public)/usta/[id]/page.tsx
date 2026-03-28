import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Star, ShieldCheck, BadgeCheck } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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
      <div className="p-4 text-sm text-[#3a3a3a]">
        <Link href="/ustalar" className="font-semibold text-[#ff6b2b] underline">
          Orqaga
        </Link>
        <p className="mt-2">Usta topilmadi.</p>
      </div>
    )
  }

  const palette = avatarPalette(master.fullName)

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-4 text-[#3a3a3a]">
      <header className="bg-[#ff6b2b] px-3 pt-safe pb-3">
        <div className="flex items-center gap-2">
          <Link href="/ustalar" className="rounded-xl bg-white/20 p-2 text-white hover:bg-white/30">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Usta profili</h1>
            <p className="text-xs text-white/70">Ishonch va tajribani ko'ring</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 fade-up px-3 pt-3">
        {/* Profile Card */}
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
              <p className="truncate text-lg font-extrabold text-[#3a3a3a]">{master.fullName}</p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  <Star className="h-3 w-3 fill-current" />
                  {master.rating.toFixed(1)} reyting
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  {master.isVerified ? "Tasdiqlangan" : "Faol usta"}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-[#8c8c8c]">
                <MapPin className="h-3.5 w-3.5" />
                {master.serviceArea}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {master.categories.map((c) => (
              <span key={c.id} className="rounded-full border border-[#e9e9e9] bg-[#f5f5f5] px-2.5 py-1 text-xs font-medium text-[#3a3a3a]">
                {c.category.icon} {c.category.nameUz}
              </span>
            ))}
          </div>

          {master.bio && (
            <p className="mt-3 rounded-xl border border-[#e9e9e9] bg-[#f7f7f7] p-2.5 text-sm text-[#5a5a5a]">
              {master.bio}
            </p>
          )}

          <div className="mt-3">
            <a href={`tel:${master.phone}`} className="action-primary inline-flex h-11 w-full items-center justify-center gap-1 text-sm">
              <Phone className="h-4 w-4" />
              Qo'ng'iroq qilish
            </a>
          </div>
        </section>

        {/* Posts */}
        <section className="surface-card p-3.5">
          <h2 className="mb-2 section-title">Ish namunalari</h2>
          <div className="space-y-2.5">
            {master.posts.length === 0 && (
              <div className="surface-card-soft rounded-xl p-3 text-sm text-[#8c8c8c]">
                Hozircha ish namunalari yo'q.
              </div>
            )}
            {master.posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-xl border border-[#e9e9e9] bg-white">
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt={post.title} className="h-40 w-full object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-bold text-[#3a3a3a]">{post.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8c8c8c]">{post.content}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="surface-card p-3.5">
          <h2 className="mb-2 section-title">Sharhlar</h2>
          <div className="space-y-2">
            {master.reviews.length === 0 && (
              <div className="surface-card-soft rounded-xl p-3 text-sm text-[#8c8c8c]">
                Hozircha sharhlar yo'q.
              </div>
            )}
            {master.reviews.map((review) => (
              <article key={review.id} className="surface-card-soft rounded-xl p-3">
                <div className="mb-1 inline-flex items-center gap-1 text-amber-600">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-sm font-bold">{review.rating}/5</span>
                </div>
                <p className="text-sm text-[#5a5a5a]">{review.comment || "Izoh qoldirilmagan"}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
