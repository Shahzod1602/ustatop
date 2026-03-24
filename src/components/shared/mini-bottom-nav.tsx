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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#090e15]/92 backdrop-blur-xl pb-safe">
      <ul className="grid grid-cols-5 px-1 py-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "mx-0.5 flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-all",
                  active
                    ? "bg-white/10 text-[#87e7eb] shadow-[inset_0_0_0_1px_rgba(134,230,235,0.35)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "drop-shadow-[0_0_8px_rgba(112,232,238,0.6)]")} />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
