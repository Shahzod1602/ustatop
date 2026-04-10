"use client"

import { useState, useTransition } from "react"
import { RequestCard } from "@/components/shared/request-card"

interface Req {
  id: string
  title: string
  description: string
  urgency: string
  status: string
  customerPhone: string
  address: string | null
  city: string
  createdAt: Date
  category: { nameUz: string; icon: string }
}

export function DashboardRequestList({ initial }: { initial: Req[] }) {
  const [requests, setRequests] = useState<Req[]>(initial)
  const [, startTransition] = useTransition()

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? "Xatolik")
      return
    }
    startTransition(() => {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
    })
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-12 text-center shadow-sm">
        <p className="font-medium text-gray-700">Hozircha yangi so&apos;rovlar yo&apos;q</p>
        <p className="mt-1 text-sm text-gray-400">
          Sizning hududingizdan so&apos;rovlar kelganda shu yerda ko&apos;rinadi
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {requests.map((req) => (
        <RequestCard
          key={req.id}
          id={req.id}
          title={req.title}
          description={req.description}
          categoryNameUz={req.category.nameUz}
          categoryIcon={req.category.icon}
          urgency={req.urgency}
          status={req.status}
          customerPhone={req.customerPhone}
          address={req.address ?? ""}
          city={req.city}
          createdAt={req.createdAt}
          onAccept={(id) => updateStatus(id, "ACCEPTED")}
          onReject={(id) => updateStatus(id, "CANCELLED")}
          onComplete={(id) => updateStatus(id, "COMPLETED")}
        />
      ))}
    </div>
  )
}
