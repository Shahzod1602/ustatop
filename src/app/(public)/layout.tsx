import { TelegramInit } from "@/components/shared/telegram-init"
import { MiniBottomNav } from "@/components/shared/mini-bottom-nav"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-0 py-0 md:px-6 md:py-8">
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden border border-white/10 bg-[linear-gradient(180deg,#0f1622_0%,#0a111a_100%)] md:min-h-[900px] md:rounded-[34px] md:shadow-[0_28px_72px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_42%_at_0%_-6%,rgba(124,231,236,0.18),transparent_60%),radial-gradient(60%_40%_at_100%_4%,rgba(244,205,111,0.14),transparent_64%)]" />
        <TelegramInit />
        <div className="relative pb-24 fade-up">{children}</div>
        <MiniBottomNav />
      </main>
    </div>
  )
}
