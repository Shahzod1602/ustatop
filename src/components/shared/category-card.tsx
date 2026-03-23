import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  id: string
  name: string
  nameUz: string
  icon: string
  slug: string
  masterCount?: number
  href?: string
  selected?: boolean
  onClick?: () => void
}

export function CategoryCard({
  nameUz,
  icon,
  slug,
  masterCount,
  href,
  selected,
  onClick,
}: CategoryCardProps) {
  const content = (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all duration-200 cursor-pointer",
        "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
          : "border-border bg-card hover:bg-accent/30"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-transform group-hover:scale-110",
          selected ? "bg-primary/10" : "bg-muted"
        )}
      >
        {icon}
      </div>
      <div>
        <p className={cn("font-semibold text-sm leading-tight", selected && "text-primary")}>
          {nameUz}
        </p>
        {masterCount !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">{masterCount} usta</p>
        )}
      </div>
      {!onClick && (
        <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )

  if (onClick) return content

  return (
    <Link href={href ?? `/request?category=${slug}`} className="block">
      {content}
    </Link>
  )
}
