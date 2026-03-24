import { TelegramInit } from "@/components/shared/telegram-init"
import { MiniBottomNav } from "@/components/shared/mini-bottom-nav"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_50%_0%,#1d2436_0%,#0a0e16_58%,#05070b_100%)] py-0 md:py-6">
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#0e1420] shadow-none md:min-h-[900px] md:rounded-[34px] md:shadow-2xl md:ring-1 md:ring-white/10">
        <TelegramInit />
        <div className="pb-20">{children}</div>
        <MiniBottomNav />
      </main>
    </div>
  )
}
