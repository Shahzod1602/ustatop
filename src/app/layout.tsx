import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className='min-h-screen bg-background font-["Avenir_Next","Nunito","Segoe_UI",sans-serif] antialiased'>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
