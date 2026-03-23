"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { uz } from "date-fns/locale"
import { MapPin, Phone, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-lg">{categoryIcon}</span>
              <span className="text-xs text-muted-foreground font-medium">{categoryNameUz}</span>
              <Badge className={cn("text-xs", getUrgencyColor(urgency))}>{getUrgencyLabel(urgency)}</Badge>
              <Badge className={cn("text-xs", getStatusColor(status))}>{getStatusLabel(status)}</Badge>
            </div>
            <h3 className="font-semibold text-base leading-tight truncate">{title}</h3>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors mt-1 shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {expanded && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
            {description}
          </p>
        )}

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <a href={`tel:${customerPhone}`} className="hover:text-primary transition-colors">
              {customerPhone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{address}, {city}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uz })}
            </span>
          </div>
        </div>

        {/* Action buttons based on status */}
        {status === "MATCHED" && (onAccept || onReject) && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleAction("reject")}
              disabled={!!loading}
            >
              {loading === "reject" ? "..." : "Rad etish"}
            </Button>
            <Button
              size="sm"
              className="flex-1"
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
            className="w-full"
            onClick={() => handleAction("complete")}
            disabled={!!loading}
          >
            {loading === "complete" ? "..." : "Yakunlash"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
