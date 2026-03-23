import { prisma } from "@/lib/prisma"
import { Users, ClipboardList, Star, CheckCircle, Clock, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true },
    }),
    prisma.master.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { categories: { include: { category: true }, take: 2 } },
    }),
  ])

  const stats = [
    { label: "Jami ustalar", value: totalMasters, icon: Users, sub: `${verifiedMasters} tasdiqlangan`, color: "text-blue-600 bg-blue-50" },
    { label: "Tasdiq kutmoqda", value: pendingMasters, icon: Clock, sub: "Usta tasdiqlanmagan", color: "text-orange-600 bg-orange-50" },
    { label: "Jami so'rovlar", value: totalRequests, icon: ClipboardList, sub: `${pendingRequests} kutilmoqda`, color: "text-purple-600 bg-purple-50" },
    { label: "Yakunlangan", value: completedRequests, icon: CheckCircle, sub: `${totalReviews} sharh`, color: "text-green-600 bg-green-50" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">UstaTop boshqaruv paneli</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, sub, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3", color)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Oxirgi so&apos;rovlar</CardTitle>
            <a href="/admin/requests" className="text-xs text-primary hover:underline">Barchasi</a>
          </CardHeader>
          <CardContent className="p-0">
            {recentRequests.map((req, i) => (
              <div key={req.id} className={cn("flex items-center gap-3 px-5 py-3", i < recentRequests.length - 1 && "border-b")}>
                <span className="text-xl">{req.category.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{req.title}</p>
                  <p className="text-xs text-muted-foreground">{req.city} · {req.customerPhone}</p>
                </div>
                <Badge className={cn("text-xs shrink-0", getStatusColor(req.status))}>
                  {getStatusLabel(req.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent masters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Yangi ustalar</CardTitle>
            <a href="/admin/masters" className="text-xs text-primary hover:underline">Barchasi</a>
          </CardHeader>
          <CardContent className="p-0">
            {recentMasters.map((master, i) => (
              <div key={master.id} className={cn("flex items-center gap-3 px-5 py-3", i < recentMasters.length - 1 && "border-b")}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {master.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{master.fullName}</p>
                  <p className="text-xs text-muted-foreground">{master.serviceArea}</p>
                </div>
                {master.isVerified ? (
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 shrink-0">Tasdiqlangan</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs shrink-0">Kutilmoqda</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
