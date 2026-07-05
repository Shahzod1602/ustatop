"use client"

import { useEffect, useRef } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface TgWin {
  Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } }
  TelegramWebviewProxy?: unknown
}

/**
 * When the public web app is opened inside Telegram, silently sign the user in
 * via initData (auto-creates a WebCustomer). This turns the "Mehmon" guest into
 * a real account without asking anything. No-op in a normal browser.
 */
export function TelegramAuth() {
  const { status } = useSession()
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    if (status !== "unauthenticated" || done.current) return

    const w = window as unknown as TgWin
    const looksLikeTelegram =
      window.location.hash.includes("tgWebApp") ||
      w.TelegramWebviewProxy !== undefined ||
      !!w.Telegram?.WebApp?.initData
    if (!looksLikeTelegram) return

    ;(async () => {
      let tg = w.Telegram?.WebApp
      if (!tg) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script")
          s.src = "https://telegram.org/js/telegram-web-app.js"
          s.async = true
          s.onload = () => resolve()
          s.onerror = () => resolve()
          document.head.appendChild(s)
        })
        tg = w.Telegram?.WebApp
      }
      const initData = tg?.initData
      if (!initData) return
      done.current = true
      tg?.ready?.()
      tg?.expand?.()
      const res = await signIn("telegram-webapp", { initData, redirect: false })
      if (res && !res.error) router.refresh()
    })()
  }, [status, router])

  return null
}
