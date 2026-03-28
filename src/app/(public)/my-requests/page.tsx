"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, UserRound, Loader2, Inbox } from "lucide-react"
import { cn, formatDate, getStatusColor, getStatusLabel, getUrgencyLabel } from "@/lib/utils"

interface MyRequest {
  id: string
  title: string
  city: string
  urgency: string
  status: string
  createdAt: string
  category: { nameUz: string; icon: string }
  master: { fullName: string; phone: string; rating: number } | null
}

export default function MyRequestsPage() {
  const [items, setItems] = useState<MyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/my-requests")
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error ?? "Xatolik")
        setItems(json.items ?? [])
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Xatolik"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-4 text-[#3a3a3a]">
      <header className="bg-[#ff6b2b] px-3 pt-safe pb-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl bg-white/20 p-2 text-white hover:bg-white/30">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Mening so'rovlarim</h1>
            <p className="text-xs text-white/70">Yuborilgan ishlar holati</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 fade-up px-3 pt-3">
        {loading && (
          <div className="surface-card inline-flex w-full items-center gap-2 p-4 text-sm text-[#8c8c8c]">
            <Loader2 className="h-4 w-4 animate-spin text-[#ff6b2b]" />
            Yuklanmoqda...
          </div>
        )}

        {error && (
          <div className="surface-card p-4 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="surface-card p-6 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-[#c0c0c0]" />
            <p className="text-sm font-bold text-[#3a3a3a]">Hozircha so'rovlar yo'q</p>
            <p className="mt-1 text-xs text-[#8c8c8c]">Birinchi xizmat so'rovingizni yuboring</p>
            <Link href="/request" className="action-primary mt-4 inline-flex text-sm">
              Yangi so'rov yuborish
            </Link>
          </div>
        )}

        {items.map((r) => (
          <article key={r.id} className="surface-card p-3.5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-[#3a3a3a]">
                  {r.category.icon} {r.title}
                </p>
                <p className="text-xs font-medium text-[#8c8c8c]">
                  {r.category.nameUz} · {r.city}
                </p>
              </div>
              <span className={cn("rounded-full px-2 py-1 text-xs font-bold", getStatusColor(r.status))}>
                {getStatusLabel(r.status)}
              </span>
            </div>

            <div className="mb-2 flex items-center gap-3 text-xs text-[#8c8c8c]">
              <span className="rounded-lg border border-[#e9e9e9] bg-[#f5f5f5] px-2 py-1">
                {getUrgencyLabel(r.urgency)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(r.createdAt)}
              </span>
            </div>

            {r.master && (
              <div className="rounded-xl border border-[#e9e9e9] bg-[#f7f7f7] p-2.5 text-xs">
                <p className="mb-1 inline-flex items-center gap-1 font-bold text-[#ff6b2b]">
                  <UserRound className="h-3.5 w-3.5" />
                  Biriktirilgan usta: {r.master.fullName}
                </p>
                <p className="text-[#8c8c8c]">
                  Tel: {r.master.phone} · Reyting: {r.master.rating.toFixed(1)}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
