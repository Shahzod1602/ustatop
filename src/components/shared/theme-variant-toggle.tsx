"use client"

import { useEffect, useState } from "react"
import { Contrast, Sparkles } from "lucide-react"

const STORAGE_KEY = "ui-theme-variant"

type Variant = "premium" | "minimal"

export function ThemeVariantToggle() {
  const [variant, setVariant] = useState<Variant>("premium")

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Variant | null) ?? "premium"
    setVariant(saved)
    document.documentElement.dataset.uiTheme = saved
  }, [])

  const onToggle = () => {
    const next: Variant = variant === "premium" ? "minimal" : "premium"
    setVariant(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.dataset.uiTheme = next
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
      aria-label="Theme variant toggle"
    >
      {variant === "premium" ? <Sparkles className="h-3.5 w-3.5" /> : <Contrast className="h-3.5 w-3.5" />}
      {variant === "premium" ? "Premium" : "Minimal"}
    </button>
  )
}
