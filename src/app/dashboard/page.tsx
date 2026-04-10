import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Star, CheckCircle, Briefcase, Monitor } from "lucide-react"
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
  if (!master) {
    await signOut({ redirectTo: "/auth/login" })
    return null
  }

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

  const activeCount = requests.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS").length
  const newRequestsCount = requests.filter((r) => r.status === "MATCHED").length

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xush kelibsiz, {master.fullName.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Bugun sizni {newRequestsCount} ta yangi so&apos;rov kutmoqda.
        </p>
      </div>

      {/* Stats Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Jobs */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Briefcase className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            FAOL ISHLAR
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            YAKUNLANGAN
          </p>
        </div>

        {/* Rating */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{master.rating.toFixed(1)}</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            O&apos;RTACHA REYTING
          </p>
        </div>

        {/* Revenue - Orange highlight card */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 p-4 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">8.4M</p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            JAMI DAROMAD
          </p>
        </div>
      </div>

      {/* Requests Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Yangi so&apos;rovlar</h2>
          <Link href="/dashboard/requests" className="text-sm font-medium text-orange-500 hover:text-orange-600">
            Hammasini ko&apos;rish
          </Link>
        </div>
        <DashboardRequestList initial={requests} />
      </div>

      {/* Recent reviews */}
      {master.reviews.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Oxirgi sharhlar</h2>
          <div className="space-y-3">
            {master.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < review.rating ? "text-amber-400" : "text-gray-200"}>
                      ★
                    </span>
                  ))}
                  <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
                </div>
                {review.comment && <p className="text-sm text-gray-500">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
