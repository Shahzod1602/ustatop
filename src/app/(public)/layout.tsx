import { TelegramInit } from "@/components/shared/telegram-init"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbe5f5_0%,#f3f6fb_55%,#e4ecf8_100%)] py-0 md:py-6">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#f3f6fb] shadow-none md:min-h-[900px] md:rounded-[34px] md:shadow-2xl md:ring-1 md:ring-slate-300/60">
        <TelegramInit />
        {children}
      </main>
    </div>
  )
}
