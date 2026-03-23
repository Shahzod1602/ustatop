import { prisma } from "@/lib/prisma"

/**
 * Find masters matching a service request by category and city.
 * Returns matched masters sorted by: verified first, then rating desc.
 */
export async function findMatchingMasters(categoryId: string, city: string) {
  return prisma.master.findMany({
    where: {
      isActive: true,
      serviceArea: { contains: city, mode: "insensitive" },
      categories: { some: { categoryId } },
    },
    include: {
      categories: {
        include: { category: { select: { id: true, nameUz: true, icon: true } } },
      },
    },
    orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
  })
}

/**
 * Match a service request to available masters.
 * Updates request status to MATCHED if any masters found.
 * Returns the matched masters.
 */
export async function matchServiceRequest(requestId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { categoryId: true, city: true },
  })
  if (!request) return []

  const masters = await findMatchingMasters(request.categoryId, request.city)

  if (masters.length > 0) {
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: "MATCHED" },
    })
  }

  return masters
}
