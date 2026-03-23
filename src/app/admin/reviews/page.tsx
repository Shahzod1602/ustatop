import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { StarRating } from "@/components/shared/star-rating"

export const dynamic = "force-dynamic"

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      master: { select: { fullName: true } },
      request: { select: { title: true, customerName: true } },
    },
  })

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sharhlar</h1>
        <p className="text-muted-foreground">
          {reviews.length} ta sharh · O&apos;rtacha reyting: ⭐ {avgRating.toFixed(1)}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Barcha sharhlar</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usta</TableHead>
                <TableHead>So&apos;rov</TableHead>
                <TableHead>Reyting</TableHead>
                <TableHead>Izoh</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium text-sm">{review.master.fullName}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate max-w-[150px]">{review.request.title}</p>
                    <p className="text-xs text-muted-foreground">{review.request.customerName}</p>
                  </TableCell>
                  <TableCell>
                    <StarRating value={review.rating} size="sm" readonly />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {review.comment ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(review.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
