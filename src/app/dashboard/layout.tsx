import { redirect } from "next/navigation"
import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { Menu, ClipboardList, Map, Newspaper, BarChart3, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")
  if (session.user.role !== "MASTER") {
    redirect("/")
  }

  const initials = session.user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  const bottomNavLinks = [
    { href: "/dashboard", icon: ClipboardList, label: "SO'ROVLAR" },
    { href: "/dashboard/map", icon: Map, label: "XARITA" },
    { href: "/dashboard/feed", icon: Newspaper, label: "YANGILIK" },
    { href: "/dashboard/stats", icon: BarChart3, label: "STATISTIKA" },
    { href: "/dashboard/profile", icon: User, label: "PROFIL" },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        <Link href="/" className="text-xl font-extrabold text-gray-900 tracking-tight">
          UstaTop
        </Link>
        <Link href="/dashboard/profile">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </header>

      {/* Main Content */}
      <main className="pb-24 px-4 pt-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {bottomNavLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-gray-400 transition-colors hover:text-orange-500"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
