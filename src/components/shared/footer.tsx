import Link from "next/link"
import { Wrench, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="h-4 w-4" />
              </div>
              UstaTop
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O&apos;zbekistonda ishonchli usta topishning eng qulay yo&apos;li.
            </p>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Toshkent, O&apos;zbekiston
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-3">Xizmatlar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/categories" className="hover:text-primary transition-colors">Barcha kategoriyalar</Link></li>
              <li><Link href="/request" className="hover:text-primary transition-colors">So&apos;rov yuborish</Link></li>
              <li><Link href="/auth/register" className="hover:text-primary transition-colors">Usta bo&apos;lish</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Usta uchun</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/auth/register" className="hover:text-primary transition-colors">Ro&apos;yxatdan o&apos;tish</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Kirish</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Aloqa</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +998 71 200 00 00
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@ustatop.uz
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} UstaTop. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  )
}
