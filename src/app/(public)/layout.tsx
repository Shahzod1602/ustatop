import { TelegramInit } from "@/components/shared/telegram-init"
import { MiniBottomNav } from "@/components/shared/mini-bottom-nav"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e0e0e0] px-0 py-0 md:px-6 md:py-8">
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden border border-[#d8d8d8] bg-[#f5f5f5] md:min-h-[900px] md:rounded-[28px] md:shadow-[0_8px_40px_rgba(0,0,0,0.14)]">
        <TelegramInit />
        <div className="relative pb-28 fade-up [&:has(.map-fullscreen)]:pb-0">{children}</div>
        <MiniBottomNav />
      </main>
    </div>
  )
}
