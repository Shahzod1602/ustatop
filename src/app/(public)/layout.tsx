import { TelegramInit } from "@/components/shared/telegram-init"
import { MiniBottomNav } from "@/components/shared/mini-bottom-nav"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-0 py-0 md:px-6 md:py-8">
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden border border-white/10 bg-[linear-gradient(180deg,#0f1521_0%,#0a1019_100%)] md:min-h-[900px] md:rounded-[34px] md:shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_40%_at_8%_-8%,rgba(120,232,236,0.18),transparent_60%),radial-gradient(55%_30%_at_100%_10%,rgba(253,205,105,0.12),transparent_60%)]" />
        <TelegramInit />
        <div className="relative pb-24">{children}</div>
        <MiniBottomNav />
      </main>
    </div>
  )
}
