import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"

export const metadata: Metadata = {
  title: { default: "UstaTop — Ishonchli usta toping", template: "%s | UstaTop" },
  description: "O'zbekistonda uy-joy ta'miri xizmatlari uchun ishonchli ustalar. Santexnik, elektrik, duradgor va boshqa ustalarni toping.",
  keywords: ["usta", "ta'mir", "santexnik", "elektrik", "toshkent", "uzbekistan"],
  authors: [{ name: "UstaTop" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "UstaTop — Ishonchli usta toping",
    description: "O'zbekistonda uy-joy ta'miri xizmatlari uchun ishonchli ustalar.",
    type: "website",
    locale: "uz_UZ",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c111a" },
    { media: "(prefers-color-scheme: dark)", color: "#0c111a" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Script id="theme-variant-init" strategy="beforeInteractive">
          {`try { var v = localStorage.getItem('ui-theme-variant') || 'premium'; document.documentElement.dataset.uiTheme = v; } catch (e) { document.documentElement.dataset.uiTheme = 'premium'; }`}
        </Script>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
