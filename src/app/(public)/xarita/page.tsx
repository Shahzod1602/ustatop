"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Navigation, X, Star, Phone, ChevronRight, Loader2, Menu, User } from "lucide-react"

interface NearbyMaster {
  id: string
  fullName: string
  phone: string
  bio: string | null
  serviceArea: string
  isVerified: boolean
  rating: number
  reviewCount: number
  profilePhoto: string | null
  latitude: number
  longitude: number
  distance: number
  categories: { category: { nameUz: string; icon: string } }[]
}

interface Category {
  id: string
  nameUz: string
  icon: string
  slug: string
}

const RADIUS_KM = 7
// Toshkent default center
const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401]

export default function XaritaPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)   // L instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const masterMarkersRef = useRef<any[]>([])

  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [masters, setMasters] = useState<NearbyMaster[]>([])
  const [selected, setSelected] = useState<NearbyMaster | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState("")
  const [mapReady, setMapReady] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("all")

  // Fetch categories for filter chips
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  // ── Bootstrap Leaflet (client-only) ──────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import("leaflet").then((L) => {
      leafletRef.current = L.default ?? L

      // Fix default icon paths (Next.js asset bundling)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.default.Icon.Default.prototype as any)._getIconUrl
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.default.map(mapRef.current!, {
        center: DEFAULT_CENTER,
        zoom: 13,
        zoomControl: false,
      })

      // Warm-tinted map tiles
      L.default.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap © CARTO",
          maxZoom: 19,
        }
      ).addTo(map)

      // Zoom buttons (top-right)
      L.default.control.zoom({ position: "topright" }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // ── Fetch nearby masters ──────────────────────────────────────
  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/masters/nearby?lat=${lat}&lng=${lng}&radius=${RADIUS_KM}`)
      const data = await res.json()
      setMasters(data.masters ?? [])
    } catch {
      // silently ignore
    }
  }, [])

  // Filter masters by category
  const filteredMasters = activeFilter === "all"
    ? masters
    : masters.filter((m) => m.categories.some((c) => c.category.nameUz === activeFilter))

  // ── Place markers on map ──────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return
    const L = leafletRef.current
    const map = mapInstanceRef.current

    // Clear old master markers
    masterMarkersRef.current.forEach((m) => m.remove())
    masterMarkersRef.current = []

    // Marker HTML is injected via Leaflet innerHTML, so any user-controlled
    // value (name, category icon) must be HTML-escaped to prevent stored XSS.
    const escapeHtml = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
      )

    filteredMasters.forEach((master) => {
      const emoji = escapeHtml(master.categories[0]?.category.icon ?? "🔧")
      const name = escapeHtml(master.fullName.split(" ")[0]?.toUpperCase() ?? "")
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="
            background:linear-gradient(135deg, #c2703a, #8B4513);
            color:#fff;
            border:2.5px solid #fff;
            border-radius:50%;
            width:42px;height:42px;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
            box-shadow:0 3px 12px rgba(139,69,19,0.4);
            cursor:pointer;
          ">${emoji}</div>
          <div style="
            background:rgba(139,69,19,0.85);
            color:#fff;
            font-size:8px;
            font-weight:800;
            padding:1px 5px;
            border-radius:4px;
            white-space:nowrap;
            letter-spacing:0.5px;
            font-family:system-ui,sans-serif;
          ">${name}</div>
        </div>`,
        iconSize: [60, 56],
        iconAnchor: [30, 28],
      })

      const marker = L.marker([master.latitude, master.longitude], { icon })
        .addTo(map)
        .on("click", () => setSelected(master))

      masterMarkersRef.current.push(marker)
    })
  }, [filteredMasters, mapReady])

  // ── Update user position on map ───────────────────────────────
  useEffect(() => {
    if (!mapReady || !userPos || !leafletRef.current) return
    const L = leafletRef.current
    const map = mapInstanceRef.current

    // Remove old user marker & circle
    userMarkerRef.current?.remove()
    circleRef.current?.remove()

    // "me" pin
    const meIcon = L.divIcon({
      className: "",
      html: `<div style="
        background:linear-gradient(135deg, #f97316, #ea580c);
        color:#fff;
        border:2.5px solid #fff;
        border-radius:50px;
        padding:5px 12px;
        font-size:11px;
        font-weight:800;
        font-family:system-ui,sans-serif;
        box-shadow:0 3px 12px rgba(249,115,22,0.4);
        white-space:nowrap;
      ">men</div>`,
      iconSize: [44, 28],
      iconAnchor: [22, 14],
    })

    userMarkerRef.current = L.marker(userPos, { icon: meIcon, zIndexOffset: 1000 }).addTo(map)

    // Radius circle
    circleRef.current = L.circle(userPos, {
      radius: RADIUS_KM * 1000,
      color: "#f97316",
      fillColor: "#f97316",
      fillOpacity: 0.06,
      weight: 2,
    }).addTo(map)

    map.flyTo(userPos, 13, { animate: true, duration: 1.2 })
    fetchNearby(userPos[0], userPos[1])
  }, [userPos, mapReady, fetchNearby])

  // ── Geolocation ───────────────────────────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocError("Brauzer geolokatsiyani qo'llab-quvvatlamaydi")
      return
    }
    setLocating(true)
    setLocError("")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPos([coords.latitude, coords.longitude])
        setLocating(false)
      },
      () => {
        setLocError("Joylashuv aniqlanmadi. Ruxsat bering.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="map-fullscreen relative flex h-screen flex-col overflow-hidden">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* ── Top bar with hamburger + avatar ── */}
      <div className="absolute left-0 right-0 top-0 z-[500] px-3 pt-3">
        <div className="flex items-center justify-between">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
            <User className="h-5 w-5 text-gray-700" />
          </Link>
        </div>

        {/* ── Category filter chips ── */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                : "bg-white text-gray-600 shadow-md hover:bg-gray-50"
            }`}
          >
            Hammasi
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.nameUz)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                activeFilter === cat.nameUz
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "bg-white text-gray-600 shadow-md hover:bg-gray-50"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.nameUz}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map container ── */}
      <div ref={mapRef} className="h-full w-full" />

      {/* ── Error ── */}
      {locError && (
        <div className="absolute left-3 right-3 top-[120px] z-[500] rounded-2xl bg-red-50 px-4 py-3 shadow-md">
          <p className="text-[12px] font-medium text-red-600">{locError}</p>
        </div>
      )}

      {/* ── Selected master card ── */}
      {selected && (
        <div className="absolute bottom-24 left-3 right-3 z-[500]">
          <div className="rounded-3xl bg-white p-4 shadow-xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 p-1.5 text-gray-400 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* Avatar / Photo */}
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50">
                {selected.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.profilePhoto} alt={selected.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">{selected.categories[0]?.category.icon ?? "🔧"}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-extrabold text-gray-900">
                  {selected.fullName}
                </p>

                {/* Rating */}
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-gray-800">
                    {selected.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({selected.reviewCount} baho)
                  </span>
                  {selected.isVerified && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Tasdiqlangan
                    </span>
                  )}
                </div>

                {/* Categories */}
                <p className="mt-1 text-xs text-gray-500">
                  {selected.categories.map((c) => c.category.nameUz).join(" va ")}
                </p>

                {selected.bio && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{selected.bio}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-3">
              <a
                href={`tel:${selected.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40"
              >
                <Phone className="h-4 w-4" />
                Bog&apos;lanish
              </a>
              <Link
                href={`/usta/${selected.id}`}
                className="flex flex-1 items-center justify-center gap-1 rounded-full border-2 border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Profil
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Locate me button ── */}
      <div className="absolute bottom-6 left-0 right-0 z-[500] flex justify-center px-6">
        <button
          onClick={locateMe}
          disabled={locating}
          className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-60"
        >
          {locating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Aniqlanmoqda...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 fill-white" />
              Menga yaqin
            </>
          )}
        </button>
      </div>
    </div>
  )
}
