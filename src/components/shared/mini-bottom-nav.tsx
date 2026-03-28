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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,13,20,0.9)_0%,rgba(8,13,20,0.97)_100%)] backdrop-blur-xl pb-safe">
      <ul className="grid grid-cols-5 px-1.5 pt-2 pb-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "mx-0.5 flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-all",
                  active
                    ? "bg-white/12 text-[#8de7ec] shadow-[inset_0_0_0_1px_rgba(141,231,236,0.38)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "drop-shadow-[0_0_8px_rgba(124,230,236,0.62)]")} />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
