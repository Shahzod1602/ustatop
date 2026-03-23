import { redirect } from "next/navigation"
import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { Wrench, LayoutDashboard, Users, ClipboardList, Star, Settings, LogOut, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"

async function AdminSignOut() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive">
        <LogOut className="h-4 w-4 mr-2" /> Chiqish
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
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-60 flex-col border-r bg-background fixed h-full hidden md:flex">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wrench className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">UstaTop</p>
            <p className="text-xs text-muted-foreground">Admin panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground px-3 mb-2">{session.user.email}</p>
          <AdminSignOut />
        </div>
      </aside>

      <div className="flex-1 md:ml-60">
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
