"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Share2,
  Megaphone,
  Eye,
  Phone,
  Tag,
  Search,
  Building2,
  Handshake,
  Heart,
  ChevronDown,
  Loader2,
  Plus,
} from "lucide-react"

interface MasterStats {
  id: string
  fullName: string
  phone: string
  rating: number
  reviewCount: number
  isVerified: boolean
  profilePhoto: string | null
  _count?: { posts: number }
}

interface Post {
  id: string
  title: string
  content: string
  imageUrl: string | null
  createdAt: string
}

type TabKey = "elon" | "bitim" | "sevimli"
type FilterStatus = "all" | "active" | "pending" | "rejected"

const STATUSES: { label: string; value: FilterStatus }[] = [
  { label: "Barchasi", value: "all" },
  { label: "Faol", value: "active" },
  { label: "Kutilmoqda", value: "pending" },
  { label: "Rad etilgan", value: "rejected" },
]

export default function KabinetPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>("elon")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [master, setMaster] = useState<MasterStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load master session
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile) setMaster(data.profile)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!master?.id) return
    fetch(`/api/master-posts?masterId=${master.id}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.items ?? []))
      .catch(() => {})
  }, [master])

  const filteredPosts = posts.filter((p) =>
    searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  )

  const displayName = master?.fullName ?? "Mehmon"
  const username = master ? `${master.fullName.split(" ")[0].toLowerCase()}_${master.phone.slice(-4)}` : "mehmon"
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5", fontFamily: "Manrope, sans-serif" }}>
      <div className="px-3 pb-6 pt-4">

        {/* ── Profile header ── */}
        <div className="mb-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <button className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => {
              if (navigator.share) navigator.share({ title: "UstaTop", url: window.location.href })
            }}>
              <Share2 className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <h2 className="text-[17px] font-extrabold text-gray-900 leading-tight">{username}</h2>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5">
                {[
                  { label: "E'lonlar", value: posts.length, icon: Megaphone },
                  { label: "Ko'rishlar", value: 0, icon: Eye },
                  { label: "Qo'ng'iroqlar", value: 0, icon: Phone },
                  { label: "Baholash", value: master?.rating.toFixed(1) ?? "0", icon: Tag },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold text-gray-900">{value}</span>
                      <span className="text-[11px] text-gray-400">{label}</span>
                    </div>
                    <Icon className="h-4 w-4 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-100">
              {master?.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={master.profilePhoto} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-100 to-blue-100">
                  <span className="text-xl font-extrabold text-blue-600">{initials}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[13px] font-semibold text-gray-700">{displayName}</p>
          {master?.isVerified && (
            <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              ✓ Tasdiqlangan usta
            </span>
          )}
        </div>

        {/* ── Balance / Actions ── */}
        <div className="mb-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          {loading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : master ? (
            <>
              <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 text-center">
                <span className="text-[13px] text-gray-500">Reyting: </span>
                <span className="text-[15px] font-bold text-gray-900">{master.rating.toFixed(1)} ★</span>
                <span className="ml-3 text-[13px] text-gray-500">{master.reviewCount} sharh</span>
              </div>
              <div className="flex gap-2.5">
                <Link
                  href="/dashboard"
                  className="flex flex-1 items-center justify-center rounded-2xl bg-gray-900 py-3 text-[13px] font-bold text-white transition-all active:scale-[0.97] hover:bg-gray-800"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="flex flex-1 items-center justify-center rounded-2xl py-3 text-[13px] font-bold text-gray-900 transition-all active:scale-[0.97] hover:brightness-95"
                  style={{ backgroundColor: "#F5C842" }}
                >
                  Profilni tahrirlash
                </Link>
              </div>
            </>
          ) : (
            <div className="flex gap-2.5">
              <Link
                href="/auth/login"
                className="flex flex-1 items-center justify-center rounded-2xl bg-gray-900 py-3 text-[13px] font-bold text-white"
              >
                Kirish
              </Link>
              <Link
                href="/auth/register"
                className="flex flex-1 items-center justify-center rounded-2xl py-3 text-[13px] font-bold text-gray-900"
                style={{ backgroundColor: "#F5C842" }}
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="mb-3 flex gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          {[
            { key: "elon" as TabKey, icon: Building2 },
            { key: "bitim" as TabKey, icon: Handshake },
            { key: "sevimli" as TabKey, icon: Heart },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-1 items-center justify-center rounded-xl py-2.5 transition-all"
              style={
                activeTab === key
                  ? { border: "2px solid #3B6FE8", backgroundColor: "#f0f4ff" }
                  : { border: "2px solid transparent" }
              }
            >
              <Icon className="h-5 w-5" style={{ color: activeTab === key ? "#3B6FE8" : "#c0bdb8" }} />
            </button>
          ))}
        </div>

        {/* ── Filters + Search ── */}
        <div className="mb-3 space-y-2.5 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Statusi
                <ChevronDown className="h-3 w-3 text-gray-500" style={{ transform: showStatusDropdown ? "rotate(180deg)" : undefined }} />
              </button>
              {showStatusDropdown && (
                <div className="absolute left-0 top-9 z-20 min-w-[140px] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                  {STATUSES.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => { setStatusFilter(value); setShowStatusDropdown(false) }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50"
                    >
                      {label}
                      {statusFilter === value && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="flex items-center gap-1 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-200">
              Tur <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
            <button className="flex items-center gap-1 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-200">
              Kategoriya <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-2.5">
            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidirish"
              className="flex-1 bg-transparent text-[13px] text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* ── Content ── */}
        {activeTab === "elon" && (
          <>
            {filteredPosts.length > 0 ? (
              <div className="space-y-2">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    {post.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.imageUrl} alt={post.title} className="mb-3 h-36 w-full rounded-xl object-cover" />
                    )}
                    <p className="text-[14px] font-bold text-gray-900">{post.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12px] text-gray-500">{post.content}</p>
                    <p className="mt-2 text-[11px] text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                ))}
                {master && (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-[13px] font-semibold text-gray-500 hover:border-gray-300"
                  >
                    <Plus className="h-4 w-4" /> Yangi e&apos;lon qo&apos;shish
                  </button>
                )}
              </div>
            ) : (
              <EmptyState tab="elon" isMaster={!!master} />
            )}
          </>
        )}

        {activeTab === "bitim" && <EmptyState tab="bitim" isMaster={!!master} />}
        {activeTab === "sevimli" && <EmptyState tab="sevimli" isMaster={!!master} />}
      </div>
    </div>
  )
}

function EmptyState({ tab, isMaster }: { tab: TabKey; isMaster: boolean }) {
  const config = {
    elon: { icon: Building2, text: "Sizda hech qanday e\u02bflon yo\u02bfq", sub: isMaster ? "Birinchi postingizni joylang" : "Tizimga kiring va e\u02bflon qo\u02bfshing" },
    bitim: { icon: Handshake, text: "Hech qanday bitim yo\u02bfq", sub: "Tugallangan ishlar shu yerda ko\u02bfrinadi" },
    sevimli: { icon: Heart, text: "Sevimlilar bo\u02bfsh", sub: "Yoqqan ustalarni saqlang" },
  }
  const { icon: Icon, text, sub } = config[tab]

  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-4">
      <div className="relative mb-6 flex items-center justify-center">
        <span className="absolute -top-4 left-6 h-3 w-3 rounded-full bg-amber-400 opacity-80" />
        <span className="absolute -top-1 right-3 h-2 w-2 rounded-full bg-amber-300 opacity-60" />
        <span className="absolute top-8 -right-5 h-2.5 w-2.5 rounded-full bg-amber-400 opacity-70" />
        <span className="absolute bottom-0 left-0 h-2 w-2 rounded-full bg-amber-300 opacity-50" />
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gray-900 shadow-xl">
          <Icon className="h-10 w-10" style={{ color: "#F5C842" }} />
        </div>
      </div>
      <p className="mb-1 text-center text-[15px] font-extrabold text-gray-900">{text}</p>
      <p className="text-center text-[12px] text-gray-400">{sub}</p>
    </div>
  )
}
