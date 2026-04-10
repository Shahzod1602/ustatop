"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, PenLine, UserRoundCog, ShieldCheck, Sparkles } from "lucide-react"

interface Profile {
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
      const profileRes = await fetch("/api/profile")
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
      if (!res.ok) throw new Error(json.error ?? "Post qoshishda xatolik")
      setPostForm({ title: "", content: "", imageUrl: "" })
      setMessage("Post qoshildi")
      await load()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Xatolik")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card fade-up mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg">Account</h1>
            <p className="text-xs text-slate-400">Profil va master rejimi boshqaruvi</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 fade-up stagger-1">
        {loading && (
          <div className="surface-card flex items-center gap-2 p-3 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yuklanmoqda...
          </div>
        )}

        {message && <p className="surface-card p-2.5 text-sm text-slate-300">{message}</p>}

        {!loading && (
          <>
            <div className="surface-card p-3.5">
              <p className="mb-1 flex items-center gap-1 text-sm font-extrabold text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Profil
              </p>
              <p className="mb-3 text-xs text-slate-400">Yagona akkaunt bilan buyurtma va master rejimini ishlating.</p>

              <div className="space-y-2">
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Ism"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#101826] px-3 text-sm text-slate-100"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+998901234567"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#101826] px-3 text-sm text-slate-100"
                />
                <input
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Shahar"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#101826] px-3 text-sm text-slate-100"
                />
                <button onClick={saveProfile} disabled={saving} className="action-primary h-10 w-full py-0 text-sm disabled:opacity-60">
                  Saqlash
                </button>
              </div>
            </div>

            {!profile?.isMaster && (
              <button onClick={enableMasterMode} disabled={saving} className="action-amber h-11 w-full text-sm disabled:opacity-60">
                Usta rejimiga otish
              </button>
            )}

            {profile?.isMaster && (
              <div className="surface-card p-3.5">
                <p className="mb-2 flex items-center gap-1 text-sm font-extrabold text-slate-100">
                  <PenLine className="h-4 w-4" />
                  Usta posti
                </p>

                <div className="space-y-2">
                  <input
                    value={postForm.title}
                    onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Post sarlavhasi"
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#101826] px-3 text-sm text-slate-100"
                  />
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Ishingiz haqida yozing..."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-[#101826] px-3 py-2 text-sm text-slate-100"
                  />
                  <input
                    value={postForm.imageUrl}
                    onChange={(e) => setPostForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="Rasm URL (ixtiyoriy)"
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#101826] px-3 text-sm text-slate-100"
                  />
                  <button onClick={createPost} disabled={saving} className="action-primary h-10 w-full py-0 text-sm disabled:opacity-60">
                    Post joylash
                  </button>
                </div>
              </div>
            )}

            <div className="surface-card p-3.5">
              <p className="mb-2 flex items-center gap-1 text-sm font-extrabold text-slate-100">
                <UserRoundCog className="h-4 w-4" />
                Mening postlarim
              </p>

              <div className="space-y-2">
                {posts.length === 0 && (
                  <div className="surface-card-soft rounded-2xl p-3 text-xs text-slate-500">Postlar yoq</div>
                )}

                {posts.map((p) => (
                  <article key={p.id} className="rounded-2xl border border-white/10 bg-[#101826] p-2.5">
                    <p className="text-sm font-bold text-slate-100">{p.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{p.content}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              Profil toliq bo'lsa, mijozlar sizni tezroq tanlaydi.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
