"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, Map, ClipboardList, Wrench, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Bosh sahifa", icon: House },
  { href: "/xarita", label: "Xarita", icon: Map },
  { href: "/my-requests", label: "So'rovlar", icon: ClipboardList },
  { href: "/ustalar", label: "Ustalar", icon: Wrench },
  { href: "/kabinet", label: "Kabinet", icon: User },
]

export function MiniBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#e9e9e9] bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] pb-safe">
      <ul className="grid grid-cols-5 px-1 pt-1 pb-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <li key={item.href} className="relative">
              {active && (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#ff6b2b]" />
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition-all",
                  active ? "text-[#ff6b2b]" : "text-[#8c8c8c] hover:text-[#3a3a3a]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
