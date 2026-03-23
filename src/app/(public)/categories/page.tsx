import type { Metadata } from "next"
import { CategoryCard } from "@/components/shared/category-card"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = { title: "Kategoriyalar" }
export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { masters: true } } },
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Barcha Kategoriyalar</h1>
        <p className="text-muted-foreground text-lg">Kerakli xizmat turini tanlang</p>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">Kategoriyalar topilmadi.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              nameUz={cat.nameUz}
              icon={cat.icon}
              slug={cat.slug}
              masterCount={cat._count.masters}
            />
          ))}
        </div>
      )}
    </div>
  )
}
