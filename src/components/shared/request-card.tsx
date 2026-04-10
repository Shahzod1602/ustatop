"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { uz } from "date-fns/locale"
import { MapPin, Phone, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, getStatusColor, getStatusLabel, getUrgencyColor, getUrgencyLabel } from "@/lib/utils"

interface RequestCardProps {
  id: string
  title: string
  description: string
  categoryNameUz: string
  categoryIcon: string
  urgency: string
  status: string
  customerPhone: string
  address: string
  city: string
  createdAt: Date
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onComplete?: (id: string) => void
}

export function RequestCard({
  id,
  title,
  description,
  categoryNameUz,
  categoryIcon,
  urgency,
  status,
  customerPhone,
  address,
  city,
  createdAt,
  onAccept,
  onReject,
  onComplete,
}: RequestCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: "accept" | "reject" | "complete") => {
    setLoading(action)
    try {
      if (action === "accept") await onAccept?.(id)
      if (action === "reject") await onReject?.(id)
      if (action === "complete") await onComplete?.(id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-lg">{categoryIcon}</span>
            <span className="text-xs font-medium text-gray-500">{categoryNameUz}</span>
            <Badge className={cn("text-[10px]", getUrgencyColor(urgency))}>{getUrgencyLabel(urgency)}</Badge>
            <Badge className={cn("text-[10px]", getStatusColor(status))}>{getStatusLabel(status)}</Badge>
          </div>
          <h3 className="truncate text-base font-semibold leading-tight text-gray-900">{title}</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 shrink-0 text-gray-400 transition-colors hover:text-gray-700"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable description */}
      {expanded && (
        <p className="mt-3 border-l-2 border-orange-300 pl-3 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      )}

      {/* Details */}
      <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{address}, {city}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uz })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <a href={`tel:${customerPhone}`} className="transition-colors hover:text-orange-500">
            {customerPhone}
          </a>
        </div>
      </div>

      {/* Action buttons based on status */}
      {status === "MATCHED" && (onAccept || onReject) && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={() => handleAction("reject")}
            disabled={!!loading}
          >
            {loading === "reject" ? "..." : "Rad etish"}
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => handleAction("accept")}
            disabled={!!loading}
          >
            {loading === "accept" ? "..." : "Qabul qilish"}
          </Button>
        </div>
      )}

      {status === "ACCEPTED" && onComplete && (
        <Button
          size="sm"
          className="mt-4 w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600"
          onClick={() => handleAction("complete")}
          disabled={!!loading}
        >
          {loading === "complete" ? "..." : "Yakunlash"}
        </Button>
      )}
    </div>
  )
}
