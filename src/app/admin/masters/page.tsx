import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { ShieldCheck, ShieldX } from "lucide-react"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

async function toggleVerification(masterId: string, verify: boolean) {
  "use server"
  await prisma.master.update({ where: { id: masterId }, data: { isVerified: verify } })
  revalidatePath("/admin/masters")
}

export default async function AdminMastersPage() {
  const masters = await prisma.master.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      categories: { include: { category: { select: { nameUz: true, icon: true } } }, take: 3 },
      _count: { select: { reviews: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl heading-gradient">Ustalar</h1>
          <p className="text-sm text-slate-400">{masters.length} ta usta ro&apos;yxatda</p>
        </div>
      </div>

      <Card className="surface-card overflow-hidden border-0 bg-transparent">
        <CardHeader className="border-b border-white/10 pb-3">
          <CardTitle className="text-base">Barcha ustalar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usta</TableHead>
                  <TableHead>Hudud</TableHead>
                  <TableHead>Kategoriyalar</TableHead>
                  <TableHead>Reyting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masters.map((master) => (
                  <TableRow key={master.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{master.fullName}</p>
                        <p className="text-xs text-muted-foreground">{master.email}</p>
                        <p className="text-xs text-muted-foreground">{master.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{master.serviceArea}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {master.categories.slice(0, 2).map(({ category }) => (
                          <Badge key={category.nameUz} variant="secondary" className="text-xs">
                            {category.icon} {category.nameUz}
                          </Badge>
                        ))}
                        {master.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{master.categories.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">⭐ {master.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground ml-1">({master._count.reviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {master.isVerified ? (
                        <Badge className="border-emerald-300/40 bg-emerald-400/15 text-xs text-emerald-200">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Tasdiqlangan
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-200 border-amber-300/35 bg-amber-400/10">
                          <ShieldX className="h-3 w-3 mr-1" /> Tasdiqlanmagan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(master.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {master.isVerified ? (
                          <form action={toggleVerification.bind(null, master.id, false)}>
                            <Button type="submit" variant="outline" size="sm" className="text-xs border-red-300/30 bg-red-400/10 text-red-200 hover:bg-red-400/20">
                              Bekor qilish
                            </Button>
                          </form>
                        ) : (
                          <form action={toggleVerification.bind(null, master.id, true)}>
                            <Button type="submit" size="sm" className="text-xs bg-[linear-gradient(180deg,#67d6dc_0%,#4caebf_100%)] text-[#07131b] hover:brightness-105">
                              Tasdiqlash
                            </Button>
                          </form>
                        )}
                      </div>
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
