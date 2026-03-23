"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void
        expand?: () => void
        initData?: string
      }
    }
  }
}

export function TelegramInit() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (!webApp) return

    webApp.ready?.()
    webApp.expand?.()

    const initData = webApp.initData
    if (!initData) return

    fetch("/api/telegram/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    }).catch(() => {})
  }, [])

  return null
}
