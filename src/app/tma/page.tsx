"use client"

import { useEffect, useState, useCallback } from "react"

// ─── Telegram WebApp typings ─────────────────────────────────────────────────
interface TgWebApp {
  initData: string
  colorScheme: "light" | "dark"
  themeParams: Record<string, string>
  ready: () => void
  expand: () => void
  openTelegramLink: (url: string) => void
  openLink: (url: string) => void
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp }
  }
}

const TG_SDK = "https://telegram.org/js/telegram-web-app.js"

function tgApp(): TgWebApp | undefined {
  return typeof window !== "undefined" ? window.Telegram?.WebApp : undefined
}

function loadTelegramSdk(): Promise<TgWebApp | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null)
    if (window.Telegram?.WebApp) return resolve(window.Telegram.WebApp)
    const s = document.createElement("script")
    s.src = TG_SDK
    s.async = true
    s.onload = () => resolve(window.Telegram?.WebApp ?? null)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthUser {
  id: string
  name: string
  role: "MASTER" | "CUSTOMER" | "ADMIN"
  isVerified: boolean
}
interface Category {
  id: string
  nameUz: string
  icon: string
}
interface FeedMaster {
  id: string
  fullName: string
  profilePhoto: string | null
  serviceArea: string
  isVerified: boolean
  rating: number
  reviewCount: number
  telegramUsername: string | null
  phone: string
  category: { nameUz: string; icon: string } | null
}
interface FeedPost {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
  master: FeedMaster
}
interface MasterProfile {
  id: string
  fullName: string
  phone: string
  extraPhones: string[]
  telegramUsername: string | null
  bio: string | null
  profilePhoto: string | null
  serviceArea: string
  isVerified: boolean
  rating: number
  reviewCount: number
  categories: { category: Category }[]
  posts: { id: string; title: string; content: string; imageUrl: string | null; createdAt: string }[]
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
async function apiPost<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}
function contactMaster(m: { telegramUsername: string | null; phone: string | null }) {
  const tg = tgApp()
  if (m.telegramUsername) {
    const url = `https://t.me/${m.telegramUsername}`
    if (tg) tg.openTelegramLink(url)
    else window.open(url, "_blank")
  } else if (m.phone) {
    window.location.href = `tel:${m.phone}`
  }
}

type Phase = "loading" | "ready" | "needTelegram" | "error"

// ─── Root ────────────────────────────────────────────────────────────────────
export default function MiniAppPage() {
  const [phase, setPhase] = useState<Phase>("loading")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    ;(async () => {
      const tg = await loadTelegramSdk()
      if (tg) {
        tg.ready()
        tg.expand()
        document.documentElement.dataset.theme = tg.colorScheme
        const bg = tg.themeParams?.bg_color
        if (bg) document.body.style.background = bg
      }
      const initData = tg?.initData ?? ""
      if (!initData) {
        setPhase("needTelegram")
        return
      }
      try {
        const res = await fetch("/api/telegram/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Auth xatoligi")
        localStorage.setItem("tma-token", data.accessToken)
        setToken(data.accessToken)
        setUser(data.user)
        setPhase("ready")
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Xatolik")
        setPhase("error")
      }
    })()
  }, [])

  if (phase === "loading") return <Centered>Yuklanmoqda…</Centered>
  if (phase === "needTelegram")
    return (
      <Centered>
        <p className="text-lg font-semibold">Bu sahifa Telegram ичida ochiladi</p>
        <p className="mt-2 text-sm opacity-70">UstaTanla botini oching va tugmani bosing.</p>
      </Centered>
    )
  if (phase === "error") return <Centered>Xatolik: {errorMsg}</Centered>

  return user?.role === "MASTER" ? (
    <MasterApp token={token} user={user} />
  ) : (
    <CustomerApp token={token} />
  )
}

// ─── Customer app: feed → master profile ─────────────────────────────────────
function CustomerApp({ token }: { token: string }) {
  const [screen, setScreen] = useState<{ name: "feed" } | { name: "master"; id: string }>({ name: "feed" })
  return screen.name === "feed" ? (
    <FeedScreen token={token} onOpenMaster={(id) => setScreen({ name: "master", id })} />
  ) : (
    <MasterProfileScreen token={token} masterId={screen.id} onBack={() => setScreen({ name: "feed" })} />
  )
}

function FeedScreen({ token, onOpenMaster }: { token: string; onOpenMaster: (id: string) => void }) {
  const [cats, setCats] = useState<Category[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<Category[]>("/api/categories", token)
      .then((c) => setCats(Array.isArray(c) ? c : []))
      .catch(() => setCats([]))
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = active ? `?categoryId=${active}` : ""
      const data = await apiGet<{ items: FeedPost[] }>(`/api/feed${q}`, token)
      setPosts(data.items ?? [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [token, active])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-md pb-10">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-[var(--bg,#fff)] px-4 py-3 backdrop-blur dark:border-white/10">
        <h1 className="text-lg font-extrabold">UstaTanla</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        <Chip active={active === null} onClick={() => setActive(null)}>
          Hammasi
        </Chip>
        {cats.map((c) => (
          <Chip key={c.id} active={active === c.id} onClick={() => setActive(c.id)}>
            {c.icon} {c.nameUz}
          </Chip>
        ))}
      </div>

      {loading ? (
        <p className="px-4 py-8 text-center opacity-60">Yuklanmoqda…</p>
      ) : posts.length === 0 ? (
        <p className="px-4 py-8 text-center opacity-60">Hozircha post yo&apos;q.</p>
      ) : (
        <div className="flex flex-col gap-4 px-3 pt-1">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onOpenMaster={() => onOpenMaster(p.master.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, onOpenMaster }: { post: FeedPost; onOpenMaster: () => void }) {
  const m = post.master
  return (
    <article className="overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
      <button onClick={onOpenMaster} className="flex w-full items-center gap-3 p-3 text-left">
        <Avatar name={m.fullName} photo={m.profilePhoto} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 font-semibold">
            <span className="truncate">{m.fullName}</span>
            {m.isVerified && <span className="text-sky-500">✓</span>}
          </div>
          <div className="truncate text-xs opacity-60">
            {m.category ? `${m.category.icon} ${m.category.nameUz}` : ""} · {m.serviceArea}
          </div>
        </div>
        <span className="text-xs opacity-50">⭐ {m.rating.toFixed(1)}</span>
      </button>
      {post.imageUrl && (
        <button onClick={onOpenMaster} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={post.title || m.fullName} className="aspect-square w-full object-cover" />
        </button>
      )}
      {(post.content || post.title) && (
        <p className="px-4 py-3 text-sm">
          <span className="font-semibold">{m.fullName}</span> {post.content || post.title}
        </p>
      )}
      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={() => contactMaster(m)}
          className="flex-1 rounded-xl bg-[#0088cc] py-2.5 text-center text-sm font-bold text-white"
        >
          ✉️ Yozish
        </button>
        <button
          onClick={onOpenMaster}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold dark:border-white/15"
        >
          Profil
        </button>
      </div>
    </article>
  )
}

function MasterProfileScreen({
  token,
  masterId,
  onBack,
}: {
  token: string
  masterId: string
  onBack: () => void
}) {
  const [m, setM] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    apiGet<MasterProfile>(`/api/masters/${masterId}`, token)
      .then(setM)
      .catch(() => setM(null))
      .finally(() => setLoading(false))
  }, [token, masterId])

  if (loading) return <Centered>Yuklanmoqda…</Centered>
  if (!m) return <Centered>Usta topilmadi</Centered>

  return (
    <div className="mx-auto max-w-md pb-10">
      <TopBar title="Profil" onBack={onBack} />
      <ProfileHeader m={m} />
      <div className="px-4">
        <button
          onClick={() => contactMaster(m)}
          className="mb-4 block w-full rounded-xl bg-[#0088cc] py-3 text-center font-bold text-white"
        >
          ✉️ Telegramda yozish
        </button>
      </div>
      <Gallery posts={m.posts} />
    </div>
  )
}

// ─── Master app: profile + create post ───────────────────────────────────────
function MasterApp({ token, user }: { token: string; user: AuthUser }) {
  const [screen, setScreen] = useState<"profile" | "newpost">("profile")
  const [reloadKey, setReloadKey] = useState(0)
  return screen === "profile" ? (
    <MasterSelf
      token={token}
      user={user}
      reloadKey={reloadKey}
      onNewPost={() => setScreen("newpost")}
    />
  ) : (
    <NewPostScreen
      token={token}
      onDone={() => {
        setReloadKey((k) => k + 1)
        setScreen("profile")
      }}
      onBack={() => setScreen("profile")}
    />
  )
}

function MasterSelf({
  token,
  user,
  reloadKey,
  onNewPost,
}: {
  token: string
  user: AuthUser
  reloadKey: number
  onNewPost: () => void
}) {
  const [m, setM] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    apiGet<MasterProfile>(`/api/masters/${user.id}`, token)
      .then(setM)
      .catch(() => setM(null))
      .finally(() => setLoading(false))
  }, [token, user.id, reloadKey])

  if (loading) return <Centered>Yuklanmoqda…</Centered>
  if (!m) return <Centered>Profil topilmadi</Centered>

  return (
    <div className="mx-auto max-w-md pb-24">
      <header className="border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h1 className="text-lg font-extrabold">Mening kabinetim</h1>
      </header>
      <ProfileHeader m={m} />
      <p className="px-4 text-xs opacity-60">📞 Asosiy raqam (o&apos;zgarmas): {m.phone}</p>
      <Gallery posts={m.posts} emptyText="Hali post yo'q. Ishlaringiz rasmini joylang." />
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-3">
        <button
          onClick={onNewPost}
          className="block w-full rounded-xl bg-[#ff6b2b] py-3 text-center font-bold text-white shadow-lg"
        >
          ➕ Yangi post
        </button>
      </div>
    </div>
  )
}

function NewPostScreen({
  token,
  onDone,
  onBack,
}: {
  token: string
  onDone: () => void
  onBack: () => void
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/tma/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Yuklashda xatolik")
      setImageUrl(data.url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    if (!imageUrl && !caption.trim()) {
      setErr("Rasm yoki izoh kiriting")
      return
    }
    setSaving(true)
    setErr("")
    try {
      await apiPost("/api/master-posts", token, { imageUrl: imageUrl ?? "", content: caption.trim() })
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md pb-10">
      <TopBar title="Yangi post" onBack={onBack} />
      <div className="px-4">
        <label className="mb-3 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-black/15 bg-black/[0.02] dark:border-white/20 dark:bg-white/[0.03]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Post" className="h-full w-full object-cover" />
          ) : (
            <span className="opacity-60">{uploading ? "Yuklanmoqda…" : "📷 Rasm tanlang"}</span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Ish haqida izoh (ixtiyoriy)…"
          rows={3}
          className="w-full rounded-xl border border-black/10 bg-transparent p-3 text-sm outline-none dark:border-white/15"
        />
        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        <button
          onClick={submit}
          disabled={saving || uploading}
          className="mt-3 block w-full rounded-xl bg-[#ff6b2b] py-3 text-center font-bold text-white disabled:opacity-50"
        >
          {saving ? "Joylanmoqda…" : "Joylash"}
        </button>
      </div>
    </div>
  )
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
function ProfileHeader({ m }: { m: MasterProfile }) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-4">
        <Avatar name={m.fullName} photo={m.profilePhoto} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-lg font-extrabold">
            <span className="truncate">{m.fullName}</span>
            {m.isVerified && <span className="text-sky-500">✓</span>}
          </div>
          <div className="text-sm opacity-70">
            {m.categories.map((c) => `${c.category.icon} ${c.category.nameUz}`).join(" · ")}
          </div>
          <div className="mt-0.5 text-xs opacity-60">
            📍 {m.serviceArea} · ⭐ {m.rating.toFixed(1)} ({m.reviewCount})
          </div>
        </div>
      </div>
      {m.bio && <p className="mt-3 whitespace-pre-line text-sm opacity-80">{m.bio}</p>}
    </div>
  )
}

function Gallery({ posts, emptyText }: { posts: MasterProfile["posts"]; emptyText?: string }) {
  const withImg = posts.filter((p) => p.imageUrl)
  if (posts.length === 0) return <p className="px-4 py-8 text-center text-sm opacity-60">{emptyText ?? "Post yo'q"}</p>
  return (
    <div className="grid grid-cols-3 gap-0.5 px-0.5">
      {withImg.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.id} src={p.imageUrl!} alt={p.title} className="aspect-square w-full object-cover" />
      ))}
    </div>
  )
}

function Avatar({ name, photo, size = 44 }: { name: string; photo: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  if (photo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover" />
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#ff6b2b]/15 font-bold text-[#ff6b2b]"
    >
      {initials}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active ? "bg-[#ff6b2b] text-white" : "bg-black/[0.05] dark:bg-white/10"
      }`}
    >
      {children}
    </button>
  )
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-[var(--bg,#fff)] px-3 py-3 backdrop-blur dark:border-white/10">
      <button onClick={onBack} className="rounded-lg px-2 py-1 text-lg">
        ←
      </button>
      <h1 className="font-bold">{title}</h1>
    </header>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">{children}</div>
}
