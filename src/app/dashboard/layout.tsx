import { redirect } from "next/navigation"
import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { Wrench, LayoutDashboard, User, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeVariantToggle } from "@/components/shared/theme-variant-toggle"

async function SignOutButton() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:bg-white/10 hover:text-red-300">
        <LogOut className="mr-2 h-4 w-4" /> Chiqish
      </Button>
    </form>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  if (session.user.role !== "MASTER") {
    // Non-master tried to access dashboard (e.g. CUSTOMER) — send to home
    redirect("/")
  }

  const initials = session.user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Bosh sahifa" },
    { href: "/dashboard/profile", icon: User, label: "Profil" },
  ]

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex max-w-[1300px] gap-4 px-3 py-4 md:px-6">
        <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur md:flex">
          <div className="mb-2 rounded-xl border border-white/10 bg-[#101826] p-3">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(140deg,#88edf1_0%,#59bfcf_100%)] text-[#08131b]">
                <Wrench className="h-4 w-4" />
              </div>
              <p className="font-extrabold">UstaTop Master</p>
            </Link>

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#153044] text-[#8ce7eb] font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{session.user.name}</p>
                {session.user.isVerified ? (
                  <Badge className="mt-1 border-emerald-300/40 bg-emerald-400/15 text-xs text-emerald-200">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Tasdiqlangan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1 border-amber-300/35 bg-amber-400/10 text-xs text-amber-200">
                    Tasdiq kutilmoqda
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <nav className="space-y-1">
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

          <div className="mt-auto border-t border-white/10 pt-3">
            <SignOutButton />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur md:px-4">
            <p className="text-sm font-semibold text-slate-300">Master Workspace</p>
            <ThemeVariantToggle />
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}
