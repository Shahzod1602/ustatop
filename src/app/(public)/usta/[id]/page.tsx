import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Star } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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

  return (
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/ustalar" className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg">Usta profili</h1>
        </div>
      </header>

      <div className="space-y-3">
        <div className="surface-card p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#153044] text-lg font-bold text-[#89e8ed]">
              {master.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={master.profilePhoto} alt={master.fullName} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                initials(master.fullName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-slate-100">{master.fullName}</p>
              <div className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-200">
                <Star className="h-4 w-4 fill-[#f6b627] text-[#f6b627]" />
                {master.rating.toFixed(1)} ({master.reviewCount})
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {master.serviceArea}
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-xs">
                {master.categories.map((c) => (
                  <span key={c.id} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-medium text-slate-200">
                    {c.category.icon} {c.category.nameUz}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {master.bio && <p className="mt-3 text-sm text-slate-300">{master.bio}</p>}
          <a href={`tel:${master.phone}`} className="action-amber mt-3 inline-flex items-center gap-1 text-sm">
            <Phone className="h-4 w-4" />
            {master.phone}
          </a>
        </div>

        <div className="surface-card p-3">
          <p className="mb-2 text-sm font-extrabold text-slate-100">Ish postlari</p>
          <div className="space-y-2">
            {master.posts.length === 0 && <p className="text-xs text-slate-500">Hozircha postlar yo'q</p>}
            {master.posts.map((post) => (
              <div key={post.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#101826]">
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt={post.title} className="h-36 w-full object-cover" />
                )}
                <div className="p-2.5">
                  <p className="text-sm font-bold text-slate-100">{post.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{post.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
