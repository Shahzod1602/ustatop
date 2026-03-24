"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, UserRound } from "lucide-react"
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
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg">Mening so'rovlarim</h1>
        </div>
      </header>

      <div className="space-y-3">
        {loading && <p className="surface-card p-3 text-sm text-slate-400">Yuklanmoqda...</p>}
        {error && <p className="surface-card p-3 text-sm text-red-400">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="surface-card p-3 text-sm text-slate-400">Hozircha so'rovlar topilmadi.</p>}

        {items.map((r) => (
          <div key={r.id} className="surface-card p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-slate-100">
                  {r.category.icon} {r.title}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {r.category.nameUz} · {r.city}
                </p>
              </div>
              <span className={cn("rounded-full px-2 py-1 text-xs font-bold", getStatusColor(r.status))}>{getStatusLabel(r.status)}</span>
            </div>

            <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="rounded bg-white/10 px-2 py-1">{getUrgencyLabel(r.urgency)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(r.createdAt)}
              </span>
            </div>

            {r.master && (
              <div className="rounded-xl border border-white/10 bg-[#101826] p-2 text-xs">
                <p className="mb-1 inline-flex items-center gap-1 font-bold text-[#89e8ed]">
                  <UserRound className="h-3.5 w-3.5" />
                  Biriktirilgan usta: {r.master.fullName}
                </p>
                <p className="text-slate-400">Tel: {r.master.phone} · Reyting: {r.master.rating.toFixed(1)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
