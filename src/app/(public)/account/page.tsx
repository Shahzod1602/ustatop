"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

interface Profile {
  telegramId: string
  fullName: string
  phone?: string
  city?: string
  isMaster: boolean
}

interface PostItem {
  id: string
  title: string
  content: string
  createdAt: string
}

async function ensureTelegramSession() {
  if (typeof window === "undefined") return
  const initData = window.Telegram?.WebApp?.initData
  if (!initData) return

  await fetch("/api/telegram/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  }).catch(() => {})
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [form, setForm] = useState({ fullName: "", phone: "", city: "Toshkent" })
  const [postForm, setPostForm] = useState({ title: "", content: "", imageUrl: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    setMessage("")
    try {
      await ensureTelegramSession()

      let profileRes = await fetch("/api/profile")
      if (profileRes.status === 401) {
        await ensureTelegramSession()
        profileRes = await fetch("/api/profile")
      }
      const profileJson = await profileRes.json()

      if (!profileRes.ok) throw new Error(profileJson.error ?? "Profilni olishda xatolik")

      const postsRes = await fetch("/api/master-posts")
      const postsJson = await postsRes.json()

      setProfile(profileJson.profile)
      setForm({
        fullName: profileJson.profile.fullName ?? "",
        phone: profileJson.profile.phone ?? "",
        city: profileJson.profile.city ?? "Toshkent",
      })
      setPosts((postsJson.items ?? []) as PostItem[])
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Xatolik")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Saqlashda xatolik")
      setProfile(json.profile)
      setMessage("Profil saqlandi")
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  const enableMasterMode = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/master-mode", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Usta rejimni yoqishda xatolik")
      setMessage("Usta rejimi yoqildi")
      await load()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  const createPost = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/master-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Post qo'shishda xatolik")
      setPostForm({ title: "", content: "", imageUrl: "" })
      setMessage("Post qo'shildi")
      await load()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <header className="bg-[#1d57b8] px-4 pb-3 pt-safe pt-5 text-white">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-lg p-1.5 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-extrabold">Account</h1>
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yuklanmoqda...
          </div>
        )}

        {message && <p className="rounded-xl bg-white p-2 text-sm text-slate-700">{message}</p>}

        {!loading && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-sm font-extrabold text-[#1f3252]">Profil</p>
              <div className="space-y-2">
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Ism"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+998901234567"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Shahar"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="h-10 w-full rounded-lg bg-[#1d57b8] text-sm font-bold text-white disabled:opacity-60"
                >
                  Saqlash
                </button>
              </div>
            </div>

            {!profile?.isMaster && (
              <button
                onClick={enableMasterMode}
                disabled={saving}
                className="h-11 w-full rounded-xl bg-[linear-gradient(180deg,#ffcb45_0%,#f4b52c_100%)] text-sm font-extrabold text-[#163a70] disabled:opacity-60"
              >
                Usta Rejimga O'tish
              </button>
            )}

            {profile?.isMaster && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-sm font-extrabold text-[#1f3252]">Reklama Posti</p>
                <div className="space-y-2">
                  <input
                    value={postForm.title}
                    onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Post sarlavhasi"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Ishingiz haqida yozing..."
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={postForm.imageUrl}
                    onChange={(e) => setPostForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="Rasm URL (ixtiyoriy)"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                  <button
                    onClick={createPost}
                    disabled={saving}
                    className="h-10 w-full rounded-lg bg-[#1d57b8] text-sm font-bold text-white disabled:opacity-60"
                  >
                    Post Joylash
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-sm font-extrabold text-[#1f3252]">Mening Postlarim</p>
              <div className="space-y-2">
                {posts.length === 0 && <p className="text-xs text-slate-500">Postlar yo'q</p>}
                {posts.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-[#f8fbff] p-2">
                    <p className="text-sm font-bold text-[#1f3252]">{p.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{p.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
