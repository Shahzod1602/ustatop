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
  HapticFeedback?: { impactOccurred?: (s: string) => void; selectionChanged?: () => void }
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
function haptic(kind: "light" | "select" = "light") {
  const h = tgApp()?.HapticFeedback
  if (kind === "select") h?.selectionChanged?.()
  else h?.impactOccurred?.("light")
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

/** Map Telegram theme -> our CSS variables. Brand accent stays constant. */
function applyTheme(tg: TgWebApp | null) {
  const root = document.documentElement
  const tp = tg?.themeParams ?? {}
  const dark = (tg?.colorScheme ?? "dark") === "dark"
  const set = (k: string, v?: string) => v && root.style.setProperty(k, v)

  set("--bg", tp.bg_color || (dark ? "#0e1116" : "#f5f6f8"))
  set("--text", tp.text_color || (dark ? "#eef1f5" : "#101418"))
  set("--hint", tp.hint_color || (dark ? "#8b95a3" : "#77818e"))
  root.style.setProperty("--card", dark ? "rgba(255,255,255,0.055)" : "rgba(17,20,24,0.035)")
  root.style.setProperty("--card-2", dark ? "rgba(255,255,255,0.09)" : "rgba(17,20,24,0.06)")
  root.style.setProperty("--border", dark ? "rgba(255,255,255,0.10)" : "rgba(17,20,24,0.09)")
  root.style.setProperty("--accent", "#ff6b2b")
  root.style.setProperty("--accent-2", "#ff8f4d")
  root.style.setProperty("--verified", "#3b9ae1")
  root.dataset.tg = dark ? "dark" : "light"
  document.body.style.background = "var(--bg)"
  document.body.style.color = "var(--text)"
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthUser { id: string; name: string; role: "MASTER" | "CUSTOMER" | "ADMIN"; isVerified: boolean }
interface Category { id: string; nameUz: string; icon: string }
interface FeedMaster {
  id: string; fullName: string; profilePhoto: string | null; serviceArea: string
  isVerified: boolean; rating: number; reviewCount: number
  telegramUsername: string | null; phone: string
  category: { nameUz: string; icon: string } | null
}
interface FeedPost { id: string; title: string; content: string; imageUrl: string | null; createdAt: string; master: FeedMaster }
interface MasterProfile {
  id: string; fullName: string; phone: string; extraPhones: string[]; telegramUsername: string | null
  bio: string | null; profilePhoto: string | null; serviceArea: string
  isVerified: boolean; rating: number; reviewCount: number
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
  haptic("light")
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
      applyTheme(tg)
      if (tg) {
        tg.ready()
        tg.expand()
      }
      const initData = tg?.initData ?? ""
      if (!initData) { setPhase("needTelegram"); return }
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

  return (
    <>
      <MiniAppStyles />
      {phase === "loading" && <Splash />}
      {phase === "needTelegram" && (
        <Centered>
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--accent)]/12 text-3xl">🛠️</div>
          <p className="text-lg font-extrabold">Telegram ichida oching</p>
          <p className="mt-1.5 max-w-[22rem] text-sm text-[var(--hint)]">
            UstaTanla botini oching va tugmani bosing — sahifa shu yerda ishlaydi.
          </p>
        </Centered>
      )}
      {phase === "error" && (
        <Centered>
          <div className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-red-500/12 text-3xl">⚠️</div>
          <p className="text-lg font-extrabold">Kirishда xatolik</p>
          <p className="mt-1.5 text-sm text-[var(--hint)]">{errorMsg}</p>
        </Centered>
      )}
      {phase === "ready" &&
        (user?.role === "MASTER" ? <MasterApp token={token} user={user} /> : <CustomerApp token={token} />)}
    </>
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
    apiGet<Category[]>("/api/categories", token).then((c) => setCats(Array.isArray(c) ? c : [])).catch(() => setCats([]))
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = active ? `?categoryId=${active}` : ""
      const data = await apiGet<{ items: FeedPost[] }>(`/api/feed${q}`, token)
      setPosts(data.items ?? [])
    } catch { setPosts([]) } finally { setLoading(false) }
  }, [token, active])

  useEffect(() => { load() }, [load])

  return (
    <Page>
      <Header />
      <div className="chips no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 pt-3">
        <Chip active={active === null} onClick={() => { haptic("select"); setActive(null) }}>Hammasi</Chip>
        {cats.map((c) => (
          <Chip key={c.id} active={active === c.id} onClick={() => { haptic("select"); setActive(c.id) }}>
            {c.icon} {c.nameUz}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 px-3 pt-1">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="🧰"
          title="Hozircha ish e'lonlari yo'q"
          hint="Ustalar ishlarini joylagach shu yerda paydo bo'ladi. Tez orada to'ladi!"
        />
      ) : (
        <div className="flex flex-col gap-4 px-3 pb-6 pt-1">
          {posts.map((p, i) => (
            <div key={p.id} className="reveal" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <PostCard post={p} onOpenMaster={() => onOpenMaster(p.master.id)} />
            </div>
          ))}
        </div>
      )}
    </Page>
  )
}

function PostCard({ post, onOpenMaster }: { post: FeedPost; onOpenMaster: () => void }) {
  const m = post.master
  return (
    <article className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]">
      <button onClick={onOpenMaster} className="flex w-full items-center gap-3 px-3.5 pb-2.5 pt-3 text-left">
        <Avatar name={m.fullName} photo={m.profilePhoto} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px] font-bold leading-tight">
            <span className="truncate">{m.fullName}</span>
            {m.isVerified && <Verified />}
          </div>
          <div className="mt-0.5 truncate text-xs text-[var(--hint)]">
            {m.category ? `${m.category.icon} ${m.category.nameUz}` : ""} · {m.serviceArea}
          </div>
        </div>
        <span className="rounded-full bg-[var(--card-2)] px-2 py-1 text-xs font-semibold">
          ⭐ {m.rating.toFixed(1)}
        </span>
      </button>

      {post.imageUrl && (
        <button onClick={onOpenMaster} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt={post.title || m.fullName} loading="lazy" className="aspect-square w-full object-cover" />
        </button>
      )}

      {(post.content || post.title) && (
        <p className="px-4 pt-3 text-[14px] leading-snug">
          <span className="font-bold">{m.fullName.split(" ")[0]}</span>{" "}
          <span className="text-[var(--text)]/90">{post.content || post.title}</span>
        </p>
      )}

      <div className="flex gap-2 p-3">
        <button
          onClick={() => contactMaster(m)}
          className="flex-1 rounded-2xl bg-[var(--accent)] py-3 text-center text-[14px] font-bold text-white active:scale-[0.98]"
          style={{ boxShadow: "0 6px 18px -6px var(--accent)" }}
        >
          ✉️ Yozish
        </button>
        <button
          onClick={() => { haptic("light"); onOpenMaster() }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-[14px] font-semibold active:scale-[0.98]"
        >
          Profil
        </button>
      </div>
    </article>
  )
}

function MasterProfileScreen({ token, masterId, onBack }: { token: string; masterId: string; onBack: () => void }) {
  const [m, setM] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    apiGet<MasterProfile>(`/api/masters/${masterId}`, token).then(setM).catch(() => setM(null)).finally(() => setLoading(false))
  }, [token, masterId])

  if (loading) return <Splash />
  if (!m) return <Centered>Usta topilmadi</Centered>

  return (
    <Page>
      <TopBar title="Usta profili" onBack={onBack} />
      <ProfileHeader m={m} />
      <div className="px-4 pb-4">
        <button
          onClick={() => contactMaster(m)}
          className="block w-full rounded-2xl bg-[var(--accent)] py-3.5 text-center font-bold text-white active:scale-[0.98]"
          style={{ boxShadow: "0 8px 22px -8px var(--accent)" }}
        >
          ✉️ Telegramda yozish
        </button>
      </div>
      <SectionLabel>Ishlar</SectionLabel>
      <Gallery posts={m.posts} />
    </Page>
  )
}

// ─── Master app ──────────────────────────────────────────────────────────────
function MasterApp({ token, user }: { token: string; user: AuthUser }) {
  const [screen, setScreen] = useState<"profile" | "newpost">("profile")
  const [reloadKey, setReloadKey] = useState(0)
  return screen === "profile" ? (
    <MasterSelf token={token} user={user} reloadKey={reloadKey} onNewPost={() => setScreen("newpost")} />
  ) : (
    <NewPostScreen token={token} onDone={() => { setReloadKey((k) => k + 1); setScreen("profile") }} onBack={() => setScreen("profile")} />
  )
}

function MasterSelf({ token, user, reloadKey, onNewPost }: { token: string; user: AuthUser; reloadKey: number; onNewPost: () => void }) {
  const [m, setM] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    apiGet<MasterProfile>(`/api/masters/${user.id}`, token).then(setM).catch(() => setM(null)).finally(() => setLoading(false))
  }, [token, user.id, reloadKey])

  if (loading) return <Splash />
  if (!m) return <Centered>Profil topilmadi</Centered>

  return (
    <Page bottomPad>
      <Header title="Mening kabinetim" />
      <ProfileHeader m={m} self />
      <SectionLabel>Mening ishlarim</SectionLabel>
      <Gallery posts={m.posts} emptyText="Hali post yo'q — ishlaringiz rasmini joylang." />
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] px-3 pb-3 pt-2"
        style={{ background: "linear-gradient(to top, var(--bg) 55%, transparent)" }}>
        <button
          onClick={() => { haptic("light"); onNewPost() }}
          className="block w-full rounded-2xl bg-[var(--accent)] py-3.5 text-center font-bold text-white active:scale-[0.98]"
          style={{ boxShadow: "0 10px 26px -8px var(--accent)" }}
        >
          ➕ Yangi post
        </button>
      </div>
    </Page>
  )
}

function NewPostScreen({ token, onDone, onBack }: { token: string; onDone: () => void; onBack: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErr("")
    try {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/tma/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Yuklashda xatolik")
      setImageUrl(data.url)
    } catch (e) { setErr(e instanceof Error ? e.message : "Xatolik") } finally { setUploading(false) }
  }

  async function submit() {
    if (!imageUrl && !caption.trim()) { setErr("Rasm yoki izoh kiriting"); return }
    setSaving(true); setErr("")
    try {
      await apiPost("/api/master-posts", token, { imageUrl: imageUrl ?? "", content: caption.trim() })
      haptic("light"); onDone()
    } catch (e) { setErr(e instanceof Error ? e.message : "Xatolik") } finally { setSaving(false) }
  }

  return (
    <Page>
      <TopBar title="Yangi post" onBack={onBack} />
      <div className="px-4 pt-1">
        <label className="mb-3 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-[var(--border)] bg-[var(--card)] active:scale-[0.99]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Post" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-[var(--hint)]">
              <div className="mb-1 text-4xl">{uploading ? "⏳" : "📷"}</div>
              <div className="text-sm font-medium">{uploading ? "Yuklanmoqda…" : "Ish rasmini tanlang"}</div>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
        <textarea
          value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="Ish haqida izoh (ixtiyoriy)…" rows={3}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3.5 text-sm outline-none placeholder:text-[var(--hint)]"
        />
        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
        <button
          onClick={submit} disabled={saving || uploading}
          className="mt-3 block w-full rounded-2xl bg-[var(--accent)] py-3.5 text-center font-bold text-white active:scale-[0.98] disabled:opacity-50"
          style={{ boxShadow: "0 10px 26px -8px var(--accent)" }}
        >
          {saving ? "Joylanmoqda…" : "Joylash"}
        </button>
      </div>
    </Page>
  )
}

// ─── Shared UI ───────────────────────────────────────────────────────────────
function ProfileHeader({ m, self }: { m: MasterProfile; self?: boolean }) {
  return (
    <div className="px-4 pb-3 pt-4">
      <div className="flex items-center gap-4">
        <Avatar name={m.fullName} photo={m.profilePhoto} size={76} ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[19px] font-extrabold leading-tight">
            <span className="truncate">{m.fullName}</span>
            {m.isVerified && <Verified size={16} />}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {m.categories.map((c) => (
              <span key={c.category.id} className="rounded-full bg-[var(--card-2)] px-2 py-0.5 text-[11px] font-semibold">
                {c.category.icon} {c.category.nameUz}
              </span>
            ))}
          </div>
          <div className="mt-1.5 text-xs text-[var(--hint)]">
            📍 {m.serviceArea} · ⭐ {m.rating.toFixed(1)} ({m.reviewCount})
          </div>
        </div>
      </div>
      {m.bio && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--text)]/90">{m.bio}</p>}
      {self && (
        <p className="mt-2 rounded-xl bg-[var(--card)] px-3 py-2 text-xs text-[var(--hint)]">
          📞 Asosiy raqam (o&apos;zgarmas): <span className="font-semibold text-[var(--text)]">{m.phone}</span>
          {!m.isVerified && <span className="ml-1">· ⏳ Tasdiqlash kutilmoqda</span>}
        </p>
      )}
    </div>
  )
}

function Gallery({ posts, emptyText }: { posts: MasterProfile["posts"]; emptyText?: string }) {
  const withImg = posts.filter((p) => p.imageUrl)
  if (withImg.length === 0)
    return <EmptyState icon="📷" title={emptyText ?? "Post yo'q"} />
  return (
    <div className="grid grid-cols-3 gap-1 px-1 pb-6">
      {withImg.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.id} src={p.imageUrl!} alt={p.title} loading="lazy" className="aspect-square w-full rounded-[6px] object-cover" />
      ))}
    </div>
  )
}

function Avatar({ name, photo, size = 44, ring }: { name: string; photo: string | null; size?: number; ring?: boolean }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  const ringCls = ring ? "ring-2 ring-[var(--accent)]/40 ring-offset-2 ring-offset-[var(--bg)]" : ""
  if (photo)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={{ width: size, height: size }} className={`shrink-0 rounded-full object-cover ${ringCls}`} />
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`grid shrink-0 place-items-center rounded-full font-extrabold text-white ${ringCls}`}
    >
      <span className="grid h-full w-full place-items-center rounded-full"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
        {initials}
      </span>
    </div>
  )
}

function Verified({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" style={{ color: "var(--verified)" }}>
      <path fill="currentColor" d="M12 1l2.6 1.9 3.2-.3 1 3 2.7 1.8-1 3 1 3-2.7 1.8-1 3-3.2-.3L12 23l-2.6-1.9-3.2.3-1-3L2.5 15.7l1-3-1-3 2.7-1.8 1-3 3.2.3z" />
      <path fill="var(--bg)" d="M10.6 14.6l-2.2-2.2-1.1 1.1 3.3 3.3 6-6-1.1-1.1z" />
    </svg>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
        active ? "text-white" : "border border-[var(--border)] bg-[var(--card)] text-[var(--text)]"
      }`}
      style={active ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 6px 16px -8px var(--accent)" } : undefined}
    >
      {children}
    </button>
  )
}

function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3"
      style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(12px)" }}>
      <div className="grid h-7 w-7 place-items-center rounded-lg text-[15px]"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
        <span>🔧</span>
      </div>
      <h1 className="text-[17px] font-extrabold tracking-tight">{title ?? "UstaTanla"}</h1>
    </header>
  )
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--border)] px-2 py-2.5"
      style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(12px)" }}>
      <button onClick={() => { haptic("light"); onBack() }} className="grid h-9 w-9 place-items-center rounded-full text-xl active:bg-[var(--card)]">‹</button>
      <h1 className="text-[16px] font-bold">{title}</h1>
    </header>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="px-4 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--hint)]">{children}</h2>
}

function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-3 grid h-20 w-20 place-items-center rounded-3xl bg-[var(--card)] text-4xl">{icon}</div>
      <p className="text-[15px] font-bold">{title}</p>
      {hint && <p className="mt-1.5 max-w-[20rem] text-sm text-[var(--hint)]">{hint}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-3 p-3.5">
        <div className="shimmer h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2"><div className="shimmer h-3 w-1/2 rounded" /><div className="shimmer h-2.5 w-1/3 rounded" /></div>
      </div>
      <div className="shimmer aspect-square w-full" />
    </div>
  )
}

function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl text-2xl"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>🔧</div>
        <div className="spinner" />
      </div>
    </div>
  )
}

function Page({ children, bottomPad }: { children: React.ReactNode; bottomPad?: boolean }) {
  return <div className={`mx-auto min-h-[100dvh] w-full max-w-[480px] ${bottomPad ? "pb-24" : "pb-4"}`}>{children}</div>
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">{children}</div>
}

function MiniAppStyles() {
  return (
    <style>{`
      html, body { overflow-x: hidden; }
      body { -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .reveal { animation: reveal .42s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes reveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      .shimmer { position: relative; overflow: hidden; background: var(--card-2); }
      .shimmer::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--text) 8%, transparent), transparent);
        animation: shimmer 1.4s infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      .spinner { width: 22px; height: 22px; border-radius: 999px;
        border: 2.5px solid var(--card-2); border-top-color: var(--accent); animation: spin .7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .reveal, .shimmer::after, .spinner { animation: none !important; } }
    `}</style>
  )
}
