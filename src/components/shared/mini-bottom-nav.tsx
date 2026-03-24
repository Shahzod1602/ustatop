"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, Grid2x2, ClipboardList, Wrench, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Bosh sahifa", icon: House },
  { href: "/categories", label: "Ruknlar", icon: Grid2x2 },
  { href: "/my-requests", label: "So'rovlar", icon: ClipboardList },
  { href: "/ustalar", label: "Ustalar", icon: Wrench },
  { href: "/account", label: "Profilim", icon: User },
]

export function MiniBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#141a27]/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors",
                  active ? "text-[#69d2d6]" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
