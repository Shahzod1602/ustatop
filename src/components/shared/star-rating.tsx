"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  size?: "sm" | "md" | "lg"
  readonly?: boolean
}

const sizes = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-7 w-7",
}

export function StarRating({ value, onChange, size = "md", readonly }: StarRatingProps) {
  const isReadonly = readonly || !onChange

  return (
    <div className="flex items-center gap-0.5" role={isReadonly ? "img" : "radiogroup"} aria-label={`${value} yulduz`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={isReadonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            isReadonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"
          )}
          aria-label={`${star} yulduz`}
        >
          <Star
            className={cn(
              sizes[size],
              "transition-colors",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  )
}
