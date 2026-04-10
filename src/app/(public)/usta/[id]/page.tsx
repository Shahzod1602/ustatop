import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Star, ShieldCheck, Share2, Bookmark, CheckCircle2, Briefcase, MessageSquare } from "lucide-react"
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f5] p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <ShieldCheck className="h-8 w-8 text-[#c0b8b0]" />
        </div>
        <p className="mb-1 text-lg font-extrabold text-[#1a1a1a]">Usta topilmadi</p>
        <p className="mb-5 text-sm text-[#8c8c8c]">Ushbu profil mavjud emas yoki o&apos;chirilgan.</p>
        <Link href="/ustalar" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#ff6b2b] px-6 text-sm font-bold text-white shadow-[0_4px_14px_rgba(255,107,43,0.3)] transition hover:bg-[#e85d20]">
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
    <div className="min-h-screen bg-[#faf8f5] pb-28 text-[#1a1a1a]">

      {/* Hero Image / Photo */}
      <div className="relative">
        {master.profilePhoto ? (
          <div className="relative h-[55vh] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={master.profilePhoto}
              alt={master.fullName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          </div>
        ) : (
          <div
            className="relative flex h-[55vh] w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${palette.bg}, ${palette.bg}dd)` }}
          >
            <span className="text-[80px] font-extrabold" style={{ color: palette.text }}>
              {initials(master.fullName)}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          </div>
        )}

        {/* Top navigation overlay */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-safe pt-4">
          <Link
            href="/ustalar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1a1a1a] shadow-lg backdrop-blur-sm transition hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1a1a1a] shadow-lg backdrop-blur-sm transition hover:bg-white">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Profile Card (overlapping hero) */}
      <div className="-mt-8 relative z-10 mx-4 rounded-2xl bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
        {/* Name + PRO badge */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-[22px] font-extrabold leading-tight text-[#1a1a1a]">{master.fullName}</h1>
            <div className="mt-1.5 flex items-center gap-2">
              <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
              <span className="text-[15px] font-bold text-[#1a1a1a]">{avgRating}</span>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#8c8c8c]">
                ({master.reviewCount} sharhlar)
              </span>
            </div>
          </div>
          {master.isVerified && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500 shadow-[0_2px_8px_rgba(20,184,166,0.4)]">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Category chips */}
        {master.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {master.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-[#e0dbd4] px-3.5 py-1.5 text-[12px] font-semibold text-[#5a5a5a]"
              >
                {c.category.icon} {c.category.nameUz}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {master.bio && (
          <p className="mt-4 text-[14px] leading-relaxed text-[#6a6460]">{master.bio}</p>
        )}

        {/* Service area */}
        <div className="mt-4 rounded-xl bg-[#f5f2ee] p-3.5">
          <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-[#8c8c8c]">
            Xizmat ko&apos;rsatish hududi
          </p>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#ff6b2b]" />
            <span className="text-[14px] font-semibold text-[#1a1a1a]">{master.serviceArea}</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <section className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
            <Briefcase className="h-4 w-4 text-[#ff6b2b]" />
          </div>
          <h2 className="text-[17px] font-extrabold text-[#1a1a1a]">Ish namunalari</h2>
          {master.posts.length > 0 && (
            <span className="ml-auto rounded-full bg-[#f5f2ee] px-2.5 py-0.5 text-[11px] font-bold text-[#8c8c8c]">
              {master.posts.length} ta
            </span>
          )}
        </div>

        {master.posts.length === 0 ? (
          <div className="rounded-xl bg-[#f5f2ee] p-5 text-center">
            <p className="text-sm text-[#8c8c8c]">Hozircha ish namunalari yo&apos;q.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {master.posts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-xl border border-[#ede8e0]">
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt={post.title} className="h-48 w-full object-cover" />
                )}
                <div className="p-3.5">
                  <p className="text-[14px] font-bold text-[#1a1a1a]">{post.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#8c8c8c]">{post.content}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
            <MessageSquare className="h-4 w-4 text-[#f59e0b]" />
          </div>
          <h2 className="text-[17px] font-extrabold text-[#1a1a1a]">Sharhlar</h2>
          {master.reviews.length > 0 && (
            <span className="ml-auto rounded-full bg-[#f5f2ee] px-2.5 py-0.5 text-[11px] font-bold text-[#8c8c8c]">
              {master.reviews.length} ta
            </span>
          )}
        </div>

        {master.reviews.length === 0 ? (
          <div className="rounded-xl bg-[#f5f2ee] p-5 text-center">
            <p className="text-sm text-[#8c8c8c]">Hozircha sharhlar yo&apos;q.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {master.reviews.map((review) => (
              <article key={review.id} className="rounded-xl bg-[#f5f2ee] p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-[#ddd8d0] text-[#ddd8d0]"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-[12px] font-bold text-[#6a6460]">{review.rating}/5</span>
                </div>
                <p className="text-[13px] leading-relaxed text-[#5a5a5a]">
                  {review.comment || "Izoh qoldirilmagan"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#ede8e0] bg-white/95 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <a
            href={`tel:${master.phone}`}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#ff6b2b] text-[15px] font-bold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(255,107,43,0.35)] transition hover:bg-[#e85d20] active:scale-[0.98]"
          >
            <Phone className="h-5 w-5" />
            Bog&apos;lanish
          </a>
          <button className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-[#e0dbd4] bg-white text-[#8c8c8c] transition hover:border-[#ff6b2b] hover:text-[#ff6b2b]">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
