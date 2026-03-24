import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, formatDate, getStatusColor, getStatusLabel, getUrgencyColor, getUrgencyLabel } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminRequestsPage() {
  const requests = await prisma.serviceRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, _count: { select: { reviews: true } } },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl heading-gradient">So&apos;rovlar</h1>
        <p className="text-sm text-slate-400">{requests.length} ta so&apos;rov jami</p>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {["PENDING", "MATCHED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => {
          const count = requests.filter((r) => r.status === s).length
          return (
            <Badge key={s} className={cn("text-sm py-1 px-3", getStatusColor(s))}>
              {getStatusLabel(s)}: {count}
            </Badge>
          )
        })}
      </div>

      <Card className="surface-card overflow-hidden border-0 bg-transparent">
        <CardHeader className="border-b border-white/10 pb-3">
          <CardTitle className="text-base">Barcha so&apos;rovlar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>So&apos;rov</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Kategoriya</TableHead>
                  <TableHead>Hudud</TableHead>
                  <TableHead>Shoshilinchlik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <p className="font-medium text-sm max-w-[200px] truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground max-w-[200px] truncate">{req.description}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{req.customerName}</p>
                      <p className="text-xs text-muted-foreground">{req.customerPhone}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {req.category.icon} {req.category.nameUz}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{req.city}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", getUrgencyColor(req.urgency))}>
                        {getUrgencyLabel(req.urgency)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", getStatusColor(req.status))}>
                        {getStatusLabel(req.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(req.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
