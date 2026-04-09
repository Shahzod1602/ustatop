"use client"

import { useState } from "react"
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
} from "lucide-react"

type TabKey = "elon" | "bitim" | "sevimli"
type FilterStatus = "all" | "active" | "pending" | "rejected"

const MOCK_STATS = [
  { label: "E'lonlar", value: 0, icon: Megaphone },
  { label: "Ko'rishlar", value: 0, icon: Eye },
  { label: "Qo'ng'iroqlar", value: 0, icon: Phone },
  { label: "Sotuvlar", value: 0, icon: Tag },
]

const TABS = [
  { key: "elon" as TabKey, icon: Building2, label: "E'lonlar" },
  { key: "bitim" as TabKey, icon: Handshake, label: "Bitimlar" },
  { key: "sevimli" as TabKey, icon: Heart, label: "Sevimlilar" },
]

const STATUSES: { label: string; value: FilterStatus }[] = [
  { label: "Barchasi", value: "all" },
  { label: "Faol", value: "active" },
  { label: "Kutilmoqda", value: "pending" },
  { label: "Rad etilgan", value: "rejected" },
]

export default function KabinetPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("elon")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5", fontFamily: "Manrope, sans-serif" }}>
      <div className="px-3 pb-6 pt-4">

        {/* ── Profile header ── */}
        <div className="mb-3 rounded-2xl bg-white px-4 py-4 shadow-sm">

          {/* top row: share + username + avatar */}
          <div className="mb-3 flex items-start gap-3">
            <button className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <h2 className="text-[17px] font-extrabold text-gray-900 leading-tight">shahzod_87</h2>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2.5">
                {MOCK_STATS.map(({ label, value, icon: Icon }) => (
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
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50">
                {/* Stylised avatar placeholder */}
                <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="22" r="10" fill="#e8956d" />
                  <rect x="8" y="38" width="48" height="26" rx="14" fill="#4a7c4e" />
                  <circle cx="32" cy="22" r="7" fill="#c8764f" />
                  <ellipse cx="32" cy="20" rx="8" ry="5" fill="#2d1a0e" />
                  <circle cx="30" cy="21" r="1" fill="#fff" opacity="0.3" />
                  {/* glasses */}
                  <rect x="22" y="23" width="8" height="5" rx="2.5" fill="none" stroke="#555" strokeWidth="1.2" />
                  <rect x="34" y="23" width="8" height="5" rx="2.5" fill="none" stroke="#555" strokeWidth="1.2" />
                  <line x1="30" y1="25.5" x2="34" y2="25.5" stroke="#555" strokeWidth="1.2" />
                </svg>
              </div>
            </div>
          </div>

          {/* display name */}
          <p className="text-[13px] font-semibold text-gray-700">shahzod</p>
        </div>

        {/* ── Balance card ── */}
        <div className="mb-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 text-center">
            <span className="text-[15px] font-bold text-gray-900">Balans: 0 UZS</span>
          </div>
          <div className="flex gap-2.5">
            <button
              className="flex-1 rounded-2xl bg-gray-900 py-3 text-[13px] font-bold text-white transition-all active:scale-[0.97] hover:bg-gray-800"
              style={{ letterSpacing: "0.01em" }}
            >
              To&apos;ldirish
            </button>
            <button
              className="flex-1 rounded-2xl py-3 text-[13px] font-bold text-gray-900 transition-all active:scale-[0.97] hover:brightness-95"
              style={{ backgroundColor: "#F5C842", letterSpacing: "0.01em" }}
            >
              To&apos;lov tarixi
            </button>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="mb-3 flex gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          {TABS.map(({ key, icon: Icon }) => (
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
              <Icon
                className="h-5 w-5 transition-colors"
                style={{ color: activeTab === key ? "#3B6FE8" : "#c0bdb8" }}
              />
            </button>
          ))}
        </div>

        {/* ── Filters + Search ── */}
        <div className="mb-3 space-y-2.5 rounded-2xl bg-white px-4 py-3 shadow-sm">

          {/* filter chips row */}
          <div className="flex flex-wrap gap-2">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Statusi
                <ChevronDown
                  className="h-3 w-3 text-gray-500 transition-transform"
                  style={{ transform: showStatusDropdown ? "rotate(180deg)" : "rotate(0deg)" }}
                />
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
                      {statusFilter === value && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="flex items-center gap-1 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-200">
              Elon maqsadi
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>

            <button className="flex items-center gap-1 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-200">
              Mulk toifasi
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>

            <button className="flex items-center gap-1 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-200">
              Saralash
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
          </div>

          {/* Search bar */}
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

        {/* ── Empty state ── */}
        <EmptyState tab={activeTab} />
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const config = {
    elon: {
      icon: Building2,
      text: "Sizda hech qanday reklama yo\u02bfq",
      sub: "Birinchi e\u02bflonizni joylang",
    },
    bitim: {
      icon: Handshake,
      text: "Hech qanday bitim yo\u02bfq",
      sub: "Sotib olish yoki ijaraga olish uchun e\u02bflonlarni ko\u02bfring",
    },
    sevimli: {
      icon: Heart,
      text: "Sevimlilar ro\u02bfyxati bo\u02bfsh",
      sub: "Yoqqan e\u02bflonlarni saqlang",
    },
  }

  const { icon: Icon, text, sub } = config[tab]

  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-4">
      {/* Decorative dots + icon circle */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* scattered dot decorations */}
        <span className="absolute -top-4 left-6 h-3 w-3 rounded-full bg-amber-400 opacity-80" />
        <span className="absolute -top-1 right-3 h-2 w-2 rounded-full bg-amber-300 opacity-60" />
        <span className="absolute top-8 -right-5 h-2.5 w-2.5 rounded-full bg-amber-400 opacity-70" />
        <span className="absolute bottom-0 left-0 h-2 w-2 rounded-full bg-amber-300 opacity-50" />
        <span className="absolute -bottom-2 right-8 h-1.5 w-1.5 rounded-full bg-amber-400 opacity-60" />

        {/* main circle */}
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gray-900 shadow-xl">
          <Icon className="h-10 w-10" style={{ color: "#F5C842" }} />
        </div>
      </div>

      <p className="mb-1 text-center text-[15px] font-extrabold text-gray-900">{text}</p>
      <p className="text-center text-[12px] text-gray-400">{sub}</p>
    </div>
  )
}
