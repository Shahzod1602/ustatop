"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Navigation, X, Star, Phone, ChevronRight, Loader2, MapPin } from "lucide-react"

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

  // ── Place markers on map ──────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return
    const L = leafletRef.current
    const map = mapInstanceRef.current

    // Clear old master markers
    masterMarkersRef.current.forEach((m) => m.remove())
    masterMarkersRef.current = []

    masters.forEach((master) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          background:#1a1a2e;
          color:#F5C842;
          border:2px solid #F5C842;
          border-radius:50%;
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          cursor:pointer;
        ">${master.categories[0]?.category.icon ?? "🔧"}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      const marker = L.marker([master.latitude, master.longitude], { icon })
        .addTo(map)
        .on("click", () => setSelected(master))

      masterMarkersRef.current.push(marker)
    })
  }, [masters, mapReady])

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
        background:#16a34a;
        color:#fff;
        border:2.5px solid #fff;
        border-radius:50px;
        padding:4px 9px;
        font-size:11px;
        font-weight:800;
        font-family:Manrope,sans-serif;
        box-shadow:0 2px 10px rgba(0,0,0,0.3);
        white-space:nowrap;
      ">men</div>`,
      iconSize: [44, 28],
      iconAnchor: [22, 14],
    })

    userMarkerRef.current = L.marker(userPos, { icon: meIcon, zIndexOffset: 1000 }).addTo(map)

    // Radius circle
    circleRef.current = L.circle(userPos, {
      radius: RADIUS_KM * 1000,
      color: "#3B6FE8",
      fillColor: "#3B6FE8",
      fillOpacity: 0.08,
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

      {/* ── Top bar ── */}
      <div className="absolute left-0 right-0 top-0 z-[500] flex items-center gap-2 px-3 pt-3">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-md">
          <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
          <span className="text-[13px] font-semibold text-gray-700">
            {userPos
              ? `${masters.length} usta topildi (${RADIUS_KM} km)`
              : "Yaqin ustalarni toping"}
          </span>
        </div>
      </div>

      {/* ── Map container ── */}
      <div ref={mapRef} className="h-full w-full" />

      {/* ── Master count badge ── */}
      {masters.length > 0 && (
        <div className="absolute right-3 top-16 z-[500] rounded-2xl bg-white px-3 py-1.5 shadow-md">
          <span className="text-[12px] font-bold text-gray-800">{masters.length} usta</span>
        </div>
      )}

      {/* ── Error ── */}
      {locError && (
        <div className="absolute left-3 right-3 top-[60px] z-[500] rounded-2xl bg-red-50 px-4 py-3 shadow-md">
          <p className="text-[12px] font-medium text-red-600">{locError}</p>
        </div>
      )}

      {/* ── Selected master card ── */}
      {selected && (
        <div className="absolute bottom-24 left-3 right-3 z-[500]">
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-full bg-gray-100 p-1 text-gray-500 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                {selected.categories[0]?.category.icon ?? "🔧"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[14px] font-extrabold text-gray-900">
                    {selected.fullName}
                  </p>
                  {selected.isVerified && (
                    <span className="flex-shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      ✓ Tasdiqlangan
                    </span>
                  )}
                </div>

                {/* Categories */}
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {selected.categories.map((c) => c.category.nameUz).join(" · ")}
                </p>

                {/* Rating + distance */}
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[12px] font-bold text-gray-800">
                      {selected.rating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      ({selected.reviewCount})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600">
                    {selected.distance.toFixed(1)} km uzoqlikda
                  </span>
                </div>

                {selected.bio && (
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{selected.bio}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${selected.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-900 py-2.5 text-[13px] font-bold text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                Qo&apos;ng&apos;iroq
              </a>
              <Link
                href={`/usta/${selected.id}`}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white py-2.5 text-[13px] font-semibold text-gray-800"
              >
                Profil
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Menga yaqin button ── */}
      <div className="absolute bottom-6 left-0 right-0 z-[500] flex justify-center px-6">
        <button
          onClick={locateMe}
          disabled={locating}
          className="flex items-center gap-2.5 rounded-2xl bg-gray-900 px-7 py-3.5 text-[14px] font-bold text-white shadow-xl transition-all active:scale-95 disabled:opacity-60"
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
