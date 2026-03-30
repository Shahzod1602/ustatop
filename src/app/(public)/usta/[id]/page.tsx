import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Star, ShieldCheck, BadgeCheck, CheckCircle2, Briefcase, MessageSquare } from "lucide-react"
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0ede8] p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <ShieldCheck className="h-8 w-8 text-[#c0b8b0]" />
        </div>
        <p className="mb-1 text-lg font-black text-[#1a1a1a]">Usta topilmadi</p>
        <p className="mb-4 text-sm text-[#8c8c8c]">Ushbu profil mavjud emas yoki o'chirilgan.</p>
        <Link href="/ustalar" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ff6b2b] px-5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,107,43,0.28)] transition hover:bg-[#e85d20]">
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Link>
      </div>
    )
  }

  const palette = avatarPalette(master.fullName)
  const avgRating = master.reviews.length > 0
    ? (master.reviews.reduce((sum, r) => sum + r.rating, 0) / master.reviews.length).toFixed(1)
    : master.rating.toFixed(1)

  return (
    <div className="min-h-screen bg-[#f0ede8] pb-4 text-[#1a1a1a]">

      {/* Header */}
      <header className="relative overflow-hidden bg-[#1a1a2e] px-3 pt-safe pb-4">
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#ff6b2b]/15" />
        <div className="relative flex items-center gap-3">
          <Link href="/ustalar" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[17px] font-black leading-tight text-white">Usta profili</h1>
            <p className="text-[11px] text-white/50">Ishonch va tajribani ko'ring</p>
          </div>
        </div>
      </header>

      <div className="fade-up space-y-3 px-3 pt-3">

        {/* Profile Card */}
        <section className="rounded-2xl border border-[#e0d8d0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              style={{ background: palette.bg, color: palette.text }}
            >
              {master.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={master.profilePhoto} alt={master.fullName} className="h-[68px] w-[68px] rounded-2xl object-cover" />
              ) : (
                initials(master.fullName)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[18px] font-black leading-tight text-[#1a1a1a]">{master.fullName}</p>
                {master.isVerified && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Tasdiqlangan
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5">
                  <Star className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                  <span className="text-[13px] font-black text-[#1a1a1a]">{avgRating}</span>
                </div>
                <span className="text-[11px] text-[#8c8c8c]">{master.reviewCount} sharh</span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-[11px] text-[#8c8c8c]">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {master.serviceArea}
              </div>
            </div>
          </div>

          {/* Categories */}
          {master.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {master.categories.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-lg border border-[#ede8e0] bg-[#faf8f5] px-2.5 py-1 text-[11px] font-semibold text-[#5a5a5a]">
                  {c.category.icon} {c.category.nameUz}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {master.bio && (
            <div className="mt-3 rounded-xl border border-[#ede8e0] bg-[#faf8f5] p-3">
              <p className="text-[13px] leading-relaxed text-[#5a5a5a]">{master.bio}</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4">
            <a
              href={`tel:${master.phone}`}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ff6b2b] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(255,107,43,0.32)] transition hover:bg-[#e85d20] active:translate-y-[1px]"
            >
              <Phone className="h-5 w-5" />
              Qo'ng'iroq qilish
            </a>
          </div>
        </section>

        {/* Posts */}
        <section className="rounded-2xl border border-[#e0d8d0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
              <Briefcase className="h-3.5 w-3.5 text-[#ff6b2b]" />
            </div>
            <h2 className="text-[16px] font-black text-[#1a1a1a]">Ish namunalari</h2>
            {master.posts.length > 0 && (
              <span className="ml-auto rounded-lg bg-[#f0ede8] px-2 py-0.5 text-[11px] font-bold text-[#8c8c8c]">
                {master.posts.length} ta
              </span>
            )}
          </div>

          {master.posts.length === 0 ? (
            <div className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] p-4 text-center">
              <p className="text-sm text-[#8c8c8c]">Hozircha ish namunalari yo'q.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {master.posts.map((post) => (
                <article key={post.id} className="overflow-hidden rounded-xl border border-[#ede8e0] bg-[#faf8f5]">
                  {post.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt={post.title} className="h-44 w-full object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-[14px] font-bold text-[#1a1a1a]">{post.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#8c8c8c]">{post.content}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="rounded-2xl border border-[#e0d8d0] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <MessageSquare className="h-3.5 w-3.5 text-[#f59e0b]" />
            </div>
            <h2 className="text-[16px] font-black text-[#1a1a1a]">Sharhlar</h2>
            {master.reviews.length > 0 && (
              <span className="ml-auto rounded-lg bg-[#f0ede8] px-2 py-0.5 text-[11px] font-bold text-[#8c8c8c]">
                {master.reviews.length} ta
              </span>
            )}
          </div>

          {master.reviews.length === 0 ? (
            <div className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] p-4 text-center">
              <p className="text-sm text-[#8c8c8c]">Hozircha sharhlar yo'q.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {master.reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-[#ede8e0] bg-[#faf8f5] p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-[#e0d8d0] text-[#e0d8d0]"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-[#8c8c8c]">{review.rating}/5</span>
                    <BadgeCheck className="ml-auto h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#5a5a5a]">
                    {review.comment || "Izoh qoldirilmagan"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
