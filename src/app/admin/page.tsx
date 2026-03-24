import { prisma } from "@/lib/prisma"
import { Users, ClipboardList, Star, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const [
    totalMasters,
    verifiedMasters,
    pendingMasters,
    totalRequests,
    pendingRequests,
    completedRequests,
    totalReviews,
    recentRequests,
    recentMasters,
  ] = await Promise.all([
    prisma.master.count(),
    prisma.master.count({ where: { isVerified: true } }),
    prisma.master.count({ where: { isVerified: false } }),
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: "PENDING" } }),
    prisma.serviceRequest.count({ where: { status: "COMPLETED" } }),
    prisma.review.count(),
    prisma.serviceRequest.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { category: true } }),
    prisma.master.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { categories: { include: { category: true }, take: 2 } } }),
  ])

  const stats = [
    { label: "Jami ustalar", value: totalMasters, icon: Users, sub: `${verifiedMasters} tasdiqlangan`, tone: "from-cyan-200 to-cyan-400" },
    { label: "Tasdiq kutmoqda", value: pendingMasters, icon: Clock, sub: "Profil tekshiruvi", tone: "from-amber-200 to-amber-400" },
    { label: "Jami so'rovlar", value: totalRequests, icon: ClipboardList, sub: `${pendingRequests} faol`, tone: "from-indigo-200 to-indigo-400" },
    { label: "Yakunlangan", value: completedRequests, icon: CheckCircle, sub: `${totalReviews} sharh`, tone: "from-emerald-200 to-emerald-400" },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl heading-gradient">Admin Dashboard</h1>
        <p className="text-sm text-slate-400">Platforma holati va so'nggi faollik</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub, tone }) => (
          <div key={label} className="surface-card p-4">
            <div className={cn("mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-[#0b1220]", tone)}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-100">{value}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-200">{label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-extrabold">Oxirgi so'rovlar</p>
            <a href="/admin/requests" className="text-xs font-semibold text-[#89e8ed]">Barchasi</a>
          </div>
          <div>
            {recentRequests.map((req, i) => (
              <div key={req.id} className={cn("flex items-center gap-3 px-4 py-3", i < recentRequests.length - 1 && "border-b border-white/10") }>
                <span className="text-xl">{req.category.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">{req.title}</p>
                  <p className="text-xs text-slate-500">{req.city} · {req.customerPhone}</p>
                </div>
                <Badge className={cn("text-xs", getStatusColor(req.status))}>{getStatusLabel(req.status)}</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-extrabold">Yangi ustalar</p>
            <a href="/admin/masters" className="text-xs font-semibold text-[#89e8ed]">Barchasi</a>
          </div>
          <div>
            {recentMasters.map((master, i) => (
              <div key={master.id} className={cn("flex items-center gap-3 px-4 py-3", i < recentMasters.length - 1 && "border-b border-white/10") }>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#153044] text-xs font-bold text-[#8ce7eb]">
                  {master.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-100">{master.fullName}</p>
                  <p className="text-xs text-slate-500">{master.serviceArea}</p>
                </div>
                <Badge className={master.isVerified ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200" : "border-amber-300/40 bg-amber-400/15 text-amber-200"}>
                  {master.isVerified ? "Tasdiqlangan" : "Kutilmoqda"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
