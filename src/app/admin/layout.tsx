import { redirect } from "next/navigation"
import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { Wrench, LayoutDashboard, Users, ClipboardList, Star, LogOut, Tag, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeVariantToggle } from "@/components/shared/theme-variant-toggle"

async function AdminSignOut() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:bg-white/10 hover:text-red-300">
        <LogOut className="mr-2 h-4 w-4" /> Chiqish
      </Button>
    </form>
  )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const navLinks = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/masters", icon: Users, label: "Ustalar" },
    { href: "/admin/requests", icon: ClipboardList, label: "So'rovlar" },
    { href: "/admin/reviews", icon: Star, label: "Sharhlar" },
    { href: "/admin/categories", icon: Tag, label: "Kategoriyalar" },
  ]

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex max-w-[1400px] gap-4 px-3 py-4 md:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur md:flex">
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#101826] px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(140deg,#88edf1_0%,#59bfcf_100%)] text-[#08131b]">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-extrabold">UstaTanla Admin</p>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>

          <nav className="mt-2 space-y-1">
            {navLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/10 pt-3">
            <p className="truncate px-3 text-xs text-slate-400">{session.user.email}</p>
            <AdminSignOut />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur md:px-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                <Shield className="h-3.5 w-3.5" />
                Admin panel
              </div>
            </div>
            <ThemeVariantToggle />
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
