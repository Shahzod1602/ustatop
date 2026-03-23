import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Star, CheckCircle, Clock, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RequestCard } from "@/components/shared/request-card"

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
    { label: "Yangi so'rovlar", value: requests.filter((r) => r.status === "MATCHED").length, icon: Clock, color: "text-yellow-600 bg-yellow-100" },
    { label: "Qabul qilingan", value: requests.filter((r) => r.status === "ACCEPTED").length, icon: Briefcase, color: "text-blue-600 bg-blue-100" },
    { label: "Yakunlangan", value: completedCount, icon: CheckCircle, color: "text-green-600 bg-green-100" },
    { label: "Reyting", value: master.rating.toFixed(1), icon: Star, color: "text-orange-600 bg-orange-100" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Xush kelibsiz, {master.fullName.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Sizning dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color} mb-3`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Kiruvchi so&apos;rovlar</h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Hozircha yangi so&apos;rovlar yo&apos;q</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sizning hududingizdan so&apos;rovlar kelganda shu yerda ko&apos;rinadi
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                id={req.id}
                title={req.title}
                description={req.description}
                categoryNameUz={req.category.nameUz}
                categoryIcon={req.category.icon}
                urgency={req.urgency}
                status={req.status}
                customerPhone={req.customerPhone}
                address={req.address ?? ""}
                city={req.city}
                createdAt={req.createdAt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent reviews */}
      {master.reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Oxirgi sharhlar</h2>
          <div className="space-y-3">
            {master.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                    ))}
                    <span className="text-sm font-medium">{review.rating}/5</span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
