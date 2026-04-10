"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, PlusCircle, ClipboardList, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/categories", label: "CATEGORIES", icon: LayoutGrid },
  { href: "/request", label: "NEW", icon: PlusCircle, isCenter: true },
  { href: "/my-requests", label: "MY REQUESTS", icon: ClipboardList },
  { href: "/kabinet", label: "PROFILE", icon: User },
]

export function MiniBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#e9e9e9] bg-white pb-safe">
      <ul className="grid grid-cols-5 px-1 pt-1 pb-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <li key={item.href} className="flex justify-center">
              {item.isCenter ? (
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5 -mt-3"
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all",
                      active
                        ? "bg-[#ff6b2b] text-white"
                        : "bg-[#ff6b2b] text-white hover:bg-[#e55a1f]"
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-wide mt-0.5",
                      active ? "text-[#ff6b2b]" : "text-[#8c8c8c]"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-bold tracking-wide transition-all",
                    active
                      ? "text-[#ff6b2b]"
                      : "text-[#8c8c8c] hover:text-[#3a3a3a]"
                  )}
                >
                  <Icon
                    className="h-5 w-5"
                    fill={active ? "currentColor" : "none"}
                    strokeWidth={active ? 1.5 : 2}
                  />
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
