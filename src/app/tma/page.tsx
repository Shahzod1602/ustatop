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
  setBackgroundColor?: (c: string) => void
  setHeaderColor?: (c: string) => void
  HapticFeedback?: { impactOccurred?: (s: string) => void; selectionChanged?: () => void }
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp }
  }
}

// ─── Brand palette (committed warm light theme — matches the web app) ─────────
const BG = "#f0ede8"

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

type Phase = "loading" | "ready" | "needTelegram" | "needMasterReg" | "error"

// ─── Root ────────────────────────────────────────────────────────────────────
export default function MiniAppPage() {
  const [phase, setPhase] = useState<Phase>("loading")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string>("")
  const [botKind, setBotKind] = useState<"master" | "customer">("customer")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    ;(async () => {
      const tg = await loadTelegramSdk()
      if (tg) {
        tg.ready()
        tg.expand()
        tg.setBackgroundColor?.(BG)
        tg.setHeaderColor?.(BG)
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
        if (data.needsMasterRegistration) { setPhase("needMasterReg"); return }
        localStorage.setItem("tma-token", data.accessToken)
        setToken(data.accessToken)
        setUser(data.user)
        setBotKind(data.botKind === "master" ? "master" : "customer")
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
        <InfoScreen icon="🛠️" title="Telegram ichida oching"
          hint="UstaTanla botini oching va tugmani bosing — sahifa shu yerda ishlaydi." />
      )}
      {phase === "error" && (
        <InfoScreen icon="⚠️" title="Kirishda xatolik" hint={errorMsg} tone="danger" />
      )}
      {phase === "needMasterReg" && (
        <InfoScreen icon="🔧" title="Avval ro'yxatdan o'ting"
          hint="Usta bo'lish uchun botga qayting va /start → “📱 Raqamni ulashish” bilan ro'yxatdan o'ting." />
      )}
      {phase === "ready" &&
        (botKind === "master" && user?.role === "MASTER"
          ? <MasterApp token={token} user={user} />
          : <CustomerApp token={token} />)}
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
      <Header eyebrow="Katalog" title="Ustalar" />
      <div className="chips no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 pt-3">
        <Chip active={active === null} onClick={() => { haptic("select"); setActive(null) }}>Hammasi</Chip>
        {cats.map((c) => (
          <Chip key={c.id} active={active === c.id} onClick={() => { haptic("select"); setActive(c.id) }}>
            {c.icon} {c.nameUz}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 flex flex-col gap-4 px-5"><SkeletonCard /><SkeletonCard /></div>
      ) : posts.length === 0 ? (
        <EmptyState icon="🧰" title="Hozircha ish e'lonlari yo'q"
          hint="Ustalar ishlarini joylagach shu yerda paydo bo'ladi. Tez orada to'ladi!" />
      ) : (
        <div className="mt-4 flex flex-col gap-4 px-5 pb-8">
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
    <article className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_14px_rgba(60,50,40,0.07)]">
      <button onClick={onOpenMaster} className="flex w-full items-center gap-3 px-4 pb-2.5 pt-3.5 text-left">
        <Avatar name={m.fullName} photo={m.profilePhoto} size={44} verified={m.isVerified} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[15px] font-bold leading-tight text-[#1a1a1a]">
            <span className="truncate">{m.fullName}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-[#8c8c8c]">
            {m.category ? `${m.category.icon} ${m.category.nameUz}` : ""} · {m.serviceArea}
          </div>
        </div>
        <span className="rounded-full bg-[#f5f2ee] px-2.5 py-1 text-xs font-bold text-[#6a6460]">
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
        <p className="px-4 pt-3 text-[14px] leading-snug text-[#3a3532]">
          <span className="font-bold text-[#1a1a1a]">{m.fullName.split(" ")[0]}</span>{" "}
          {post.content || post.title}
        </p>
      )}

      <div className="flex gap-2 p-3.5">
        <button
          onClick={() => contactMaster(m)}
          className="flex-1 rounded-full bg-[#ff6b2b] py-3 text-center text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(255,107,43,0.28)] transition active:scale-[0.98]"
        >
          ✉️ Yozish
        </button>
        <button
          onClick={() => { haptic("light"); onOpenMaster() }}
          className="rounded-full border border-[#e8e4de] bg-white px-5 py-3 text-[14px] font-semibold text-[#6a6460] transition active:scale-[0.98]"
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
  if (!m) return <InfoScreen icon="🔍" title="Usta topilmadi" />

  return (
    <Page>
      <TopBar title="Usta profili" onBack={onBack} />
      <ProfileHeader m={m} />
      <div className="px-5 pb-4">
        <button
          onClick={() => contactMaster(m)}
          className="block w-full rounded-full bg-[#ff6b2b] py-3.5 text-center font-bold text-white shadow-[0_8px_20px_rgba(255,107,43,0.3)] transition active:scale-[0.98]"
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
  if (!m) return <InfoScreen icon="🔧" title="Profil topilmadi" />

  return (
    <Page bottomPad>
      <Header eyebrow="Usta kabineti" title="Mening ishlarim" />
      <ProfileHeader m={m} self />
      <SectionLabel>Postlarim</SectionLabel>
      <Gallery posts={m.posts} emptyText="Hali post yo'q — ishlaringiz rasmini joylang." />
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] px-5 pb-4 pt-3"
        style={{ background: `linear-gradient(to top, ${BG} 55%, transparent)` }}>
        <button
          onClick={() => { haptic("light"); onNewPost() }}
          className="block w-full rounded-full bg-[#ff6b2b] py-3.5 text-center font-bold text-white shadow-[0_10px_24px_rgba(255,107,43,0.32)] transition active:scale-[0.98]"
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
      <div className="px-5 pt-1">
        <label className="mb-3 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#dcd6cd] bg-white transition active:scale-[0.99]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Post" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-[#a89f96]">
              <div className="mb-1 text-4xl">{uploading ? "⏳" : "📷"}</div>
              <div className="text-sm font-semibold">{uploading ? "Yuklanmoqda…" : "Ish rasmini tanlang"}</div>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
        <textarea
          value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="Ish haqida izoh (ixtiyoriy)…" rows={3}
          className="w-full rounded-2xl border border-[#e8e4de] bg-white p-3.5 text-sm text-[#1a1a1a] outline-none transition-colors placeholder:text-[#b0a8a0] focus:border-[#ff6b2b]"
        />
        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        <button
          onClick={submit} disabled={saving || uploading}
          className="mt-3 block w-full rounded-full bg-[#ff6b2b] py-3.5 text-center font-bold text-white shadow-[0_10px_24px_rgba(255,107,43,0.32)] transition active:scale-[0.98] disabled:opacity-50"
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
    <div className="px-5 pb-3 pt-4">
      <div className="rounded-3xl bg-white p-4 shadow-[0_2px_14px_rgba(60,50,40,0.07)]">
        <div className="flex items-center gap-4">
          <Avatar name={m.fullName} photo={m.profilePhoto} size={72} verified={m.isVerified} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[19px] font-extrabold leading-tight text-[#1a1a1a]">{m.fullName}</div>
            {m.isVerified && <div className="text-xs font-semibold text-blue-600">Tasdiqlangan usta</div>}
            <div className="mt-1.5 text-xs text-[#8c8c8c]">📍 {m.serviceArea} · ⭐ {m.rating.toFixed(1)} ({m.reviewCount})</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.categories.map((c) => (
            <span key={c.category.id} className="rounded-full bg-[#ff6b2b]/10 px-2.5 py-1 text-[11px] font-semibold text-[#ff6b2b]">
              {c.category.icon} {c.category.nameUz}
            </span>
          ))}
        </div>
        {m.bio && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#3a3532]">{m.bio}</p>}
        {self && (
          <p className="mt-3 rounded-xl bg-[#f5f2ee] px-3 py-2 text-xs text-[#8c8c8c]">
            📞 Asosiy raqam (o&apos;zgarmas): <span className="font-semibold text-[#1a1a1a]">{m.phone}</span>
            {!m.isVerified && <span className="ml-1">· ⏳ Tasdiqlash kutilmoqda</span>}
          </p>
        )}
      </div>
    </div>
  )
}

function Gallery({ posts, emptyText }: { posts: MasterProfile["posts"]; emptyText?: string }) {
  const withImg = posts.filter((p) => p.imageUrl)
  if (withImg.length === 0) return <EmptyState icon="📷" title={emptyText ?? "Post yo'q"} />
  return (
    <div className="grid grid-cols-3 gap-1.5 px-5 pb-8">
      {withImg.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.id} src={p.imageUrl!} alt={p.title} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
      ))}
    </div>
  )
}

function Avatar({ name, photo, size = 44, verified }: { name: string; photo: string | null; size?: number; verified?: boolean }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-full bg-[#ff6b2b]/12 font-extrabold text-[#ff6b2b]"
          style={{ fontSize: size * 0.36 }}>{initials}</div>
      )}
      {verified && (
        <svg className="absolute -bottom-0.5 -right-0.5" width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#fff" />
          <path fill="#3b9ae1" d="M12 2l2.3 1.6 2.8-.2.9 2.6 2.4 1.6-.9 2.6.9 2.6-2.4 1.6-.9 2.6-2.8-.2L12 22l-2.3-1.6-2.8.2-.9-2.6L3.6 16.4l.9-2.6-.9-2.6L6 9.6l.9-2.6 2.8.2z" />
          <path fill="#fff" d="M10.6 14.3l-2-2-1.1 1.1 3.1 3.1 5.6-5.6-1.1-1.1z" />
        </svg>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition active:scale-95 ${
        active
          ? "border-[#ff6b2b] bg-[#ff6b2b]/10 text-[#ff6b2b]"
          : "border-[#e0dbd4] bg-white text-[#6a6460]"
      }`}
    >
      {children}
    </button>
  )
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="sticky top-0 z-10 px-5 pb-3 pt-4"
      style={{ background: `color-mix(in srgb, ${BG} 85%, transparent)`, backdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#ff6b2b] text-[15px] shadow-[0_4px_12px_rgba(255,107,43,0.3)]">🔧</div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff6b2b]">{eyebrow}</p>
          <h1 className="text-[19px] font-extrabold leading-none tracking-tight text-[#1a1a1a]">{title}</h1>
        </div>
      </div>
    </header>
  )
}

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3"
      style={{ background: `color-mix(in srgb, ${BG} 85%, transparent)`, backdropFilter: "blur(10px)" }}>
      <button onClick={() => { haptic("light"); onBack() }}
        className="grid h-9 w-9 place-items-center rounded-full bg-white text-xl text-[#1a1a1a] shadow-sm active:scale-95">‹</button>
      <h1 className="text-[16px] font-bold text-[#1a1a1a]">{title}</h1>
    </header>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="px-5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a89f96]">{children}</h2>
}

function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="px-5 pt-6">
      <div className="rounded-3xl bg-white p-10 text-center shadow-[0_2px_14px_rgba(60,50,40,0.06)]">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f5f2ee] text-3xl">{icon}</div>
        <p className="text-[16px] font-extrabold text-[#1a1a1a]">{title}</p>
        {hint && <p className="mx-auto mt-1.5 max-w-[20rem] text-sm text-[#8c8c8c]">{hint}</p>}
      </div>
    </div>
  )
}

function InfoScreen({ icon, title, hint, tone }: { icon: string; title: string; hint?: string; tone?: "danger" }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-8 text-center">
      <div className={`mb-3 grid h-20 w-20 place-items-center rounded-3xl text-4xl ${tone === "danger" ? "bg-red-500/10" : "bg-[#ff6b2b]/10"}`}>{icon}</div>
      <p className="text-lg font-extrabold text-[#1a1a1a]">{title}</p>
      {hint && <p className="mt-1.5 max-w-[22rem] text-sm text-[#8c8c8c]">{hint}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_14px_rgba(60,50,40,0.06)]">
      <div className="flex items-center gap-3 p-4">
        <div className="shimmer h-11 w-11 rounded-full" />
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
        <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-[#ff6b2b] text-2xl shadow-[0_8px_20px_rgba(255,107,43,0.3)]">🔧</div>
        <div className="spinner" />
      </div>
    </div>
  )
}

function Page({ children, bottomPad }: { children: React.ReactNode; bottomPad?: boolean }) {
  return <div className={`mx-auto min-h-[100dvh] w-full max-w-[480px] ${bottomPad ? "pb-24" : "pb-4"}`}>{children}</div>
}

function MiniAppStyles() {
  return (
    <style>{`
      html, body { overflow-x: hidden; background: ${BG}; }
      body { color: #1a1a1a; -webkit-font-smoothing: antialiased;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .reveal { animation: reveal .42s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes reveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      .shimmer { position: relative; overflow: hidden; background: #ece7e0; }
      .shimmer::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent); animation: shimmer 1.4s infinite; }
      @keyframes shimmer { 100% { transform: translateX(100%); } }
      .spinner { width: 22px; height: 22px; border-radius: 999px;
        border: 2.5px solid #e4ded5; border-top-color: #ff6b2b; animation: spin .7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .reveal, .shimmer::after, .spinner { animation: none !important; } }
    `}</style>
  )
}
