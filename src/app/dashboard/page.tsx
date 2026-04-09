import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Star, CheckCircle, Clock, Briefcase } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardRequestList } from "./_components/request-list"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const master = await prisma.master.findUnique({
    where: { id: session.user.id },
    include: {
      categories: { include: { category: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  })
  if (!master) redirect("/auth/login")

  // Fetch matched/accepted requests for this master's categories and city
  const categoryIds = master.categories.map((c) => c.categoryId)
  const requests = await prisma.serviceRequest.findMany({
    where: {
      OR: [
        {
          status: "MATCHED",
          categoryId: { in: categoryIds },
          city: { contains: master.serviceArea, mode: "insensitive" },
        },
        {
          status: { in: ["ACCEPTED", "IN_PROGRESS"] },
          masterId: master.id,
        },
      ],
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const completedCount = await prisma.serviceRequest.count({
    where: {
      status: "COMPLETED",
      masterId: master.id,
    },
  })

  const stats = [
    { label: "Yangi so'rovlar", value: requests.filter((r) => r.status === "MATCHED").length, icon: Clock, tone: "from-amber-200 to-amber-400" },
    { label: "Qabul qilingan", value: requests.filter((r) => r.status === "ACCEPTED").length, icon: Briefcase, tone: "from-cyan-200 to-cyan-400" },
    { label: "Yakunlangan", value: completedCount, icon: CheckCircle, tone: "from-emerald-200 to-emerald-400" },
    { label: "Reyting", value: master.rating.toFixed(1), icon: Star, tone: "from-orange-200 to-orange-400" },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl heading-gradient">Xush kelibsiz, {master.fullName.split(" ")[0]}!</h1>
        <p className="text-sm text-slate-400">Sizning ish oqimingiz va kiruvchi so'rovlar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="surface-card border-0 bg-transparent">
            <CardContent className="p-4">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-[#0b1220] ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Kiruvchi so&apos;rovlar</h2>
        <DashboardRequestList initial={requests} />
      </div>

      {/* Recent reviews */}
      {master.reviews.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Oxirgi sharhlar</h2>
          <div className="space-y-3">
            {master.reviews.map((review) => (
              <Card key={review.id} className="surface-card border-0 bg-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                    ))}
                    <span className="text-sm font-medium text-slate-200">{review.rating}/5</span>
                  </div>
                  {review.comment && <p className="text-sm text-slate-400">{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
