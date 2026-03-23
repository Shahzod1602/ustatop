import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Wrench, LayoutDashboard, User, LogOut, Bell, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/lib/auth"

async function SignOutButton() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive">
        <LogOut className="h-4 w-4 mr-2" /> Chiqish
      </Button>
    </form>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "MASTER") redirect("/auth/login")

  const initials = session.user.name
    ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Bosh sahifa" },
    { href: "/dashboard/profile", icon: User, label: "Profil" },
  ]

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background fixed h-full">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wrench className="h-3.5 w-3.5" />
            </div>
            UstaTop
          </Link>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{session.user.name}</p>
              <div className="flex items-center gap-1">
                {session.user.isVerified ? (
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 py-0">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Tasdiqlangan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs py-0">Tasdiq kutilmoqda</Badge>
                )}
              </div>
            </div>
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
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wrench className="h-3.5 w-3.5" />
          </div>
          UstaTop
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/profile">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <div className="md:hidden h-14" /> {/* mobile spacer */}
        <main className="p-4 md:p-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background px-4 py-2 flex justify-around">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-primary py-1">
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
          <button type="submit" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground hover:text-destructive py-1">
            <LogOut className="h-5 w-5" />
            Chiqish
          </button>
        </form>
      </div>
    </div>
  )
}
