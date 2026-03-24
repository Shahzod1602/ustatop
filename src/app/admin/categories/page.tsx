import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { masters: true, requests: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl heading-gradient">Kategoriyalar</h1>
        <p className="text-sm text-slate-400">{categories.length} ta kategoriya</p>
      </div>

      <Card className="surface-card overflow-hidden border-0 bg-transparent">
        <CardHeader className="border-b border-white/10 pb-3">
          <CardTitle className="text-base">Barcha kategoriyalar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Ustalar</TableHead>
                <TableHead>So&apos;rovlar</TableHead>
                <TableHead>Yaratilgan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{cat.nameUz}</p>
                        <p className="text-xs text-muted-foreground">{cat.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{cat.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{cat._count.masters}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{cat._count.requests}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(cat.createdAt)}
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
