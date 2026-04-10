"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ImagePlus, Loader2, MapPin, X, TriangleAlert, Check, ArrowLeft, ChevronRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { serviceRequestSchema, type ServiceRequestInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Category {
  id: string
  name: string
  nameUz: string
  icon: string
  slug: string
}

interface Profile {
  fullName: string
  phone?: string
}

const URGENCY_OPTIONS = [
  { value: "LOW", label: "Past", icon: "✅", color: "border-emerald-200 bg-emerald-50", activeColor: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20", iconBg: "bg-emerald-500", desc: "Shoshilmaydi" },
  { value: "MEDIUM", label: "O'rta", icon: "⚠️", color: "border-orange-200 bg-orange-50", activeColor: "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20", iconBg: "bg-orange-500", desc: "Bir necha kun" },
  { value: "HIGH", label: "Muhim", icon: "🔴", color: "border-red-200 bg-red-50", activeColor: "border-red-500 bg-red-50 ring-2 ring-red-500/20", iconBg: "bg-red-500", desc: "Bugun kerak" },
  { value: "URGENT", label: "Tezda", icon: "🚨", color: "border-red-200 bg-red-50", activeColor: "border-red-600 bg-red-50 ring-2 ring-red-600/20", iconBg: "bg-red-600", desc: "Hoziroq kerak" },
]

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Fargona", "Qarshi", "Nukus"]

const STEP_CONFIG = [
  { label: "Tur tanlash", stepLabel: "QADAM 1 / 3", pct: 33 },
  { label: "So'rov tafsilotlari", stepLabel: "QADAM 2 / 3", pct: 60 },
  { label: "Aloqa ma'lumoti", stepLabel: "QADAM 3 / 3", pct: 100 },
]

function RequestPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categorySlug = searchParams.get("category")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ServiceRequestInput>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      city: "Toshkent",
      urgency: "MEDIUM",
      customerName: "",
      customerPhone: "",
      title: "",
      description: "",
      address: "",
      categoryId: "",
    },
  })

  const watchedUrgency = watch("urgency")
  const watchedCategoryId = watch("categoryId")

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]))

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile)
          if (data.profile.fullName) setValue("customerName", data.profile.fullName)
          if (data.profile.phone) setValue("customerPhone", data.profile.phone)
        }
      })
      .catch(() => setProfile(null))
  }, [setValue])

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug) ?? categories.find((c) => c.id === watchedCategoryId) ?? null,
    [categories, categorySlug, watchedCategoryId]
  )

  useEffect(() => {
    if (selectedCategory) setValue("categoryId", selectedCategory.id)
  }, [selectedCategory, setValue])

  // If category came from URL param, skip to step 1
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const found = categories.find((c) => c.slug === categorySlug)
      if (found) {
        setValue("categoryId", found.id)
        setStep(1)
      }
    }
  }, [categorySlug, categories, setValue])

  const onSubmit = async (data: ServiceRequestInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Xatolik")
      router.push(`/ustalar?requestId=${json.requestId}`)
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Yuborishda xatolik",
        description: err instanceof Error ? err.message : "Qayta urinib koring",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (step === 0) {
      if (!watchedCategoryId) {
        toast({ variant: "destructive", title: "Kategoriyani tanlang" })
        return
      }
      setStep(1)
    } else if (step === 1) {
      const valid = await trigger(["title", "description", "urgency"])
      if (valid) setStep(2)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
    else router.push("/")
  }

  const currentConfig = STEP_CONFIG[step]

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Step indicator header */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={handleBack} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {currentConfig.stepLabel}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-bold text-gray-900">{currentConfig.label}</h1>
        <p className="mt-0.5 text-sm text-gray-400">{currentConfig.pct}% tugallandi</p>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${currentConfig.pct}%` }}
          />
        </div>
      </div>

      {/* Step 0: Category selection */}
      {step === 0 && (
        <div className="mt-4 px-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">XIZMAT TURINI TANLANG</p>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setValue("categoryId", cat.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition-all ${
                  watchedCategoryId === cat.id
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-500/20"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{cat.nameUz}</span>
                {watchedCategoryId === cat.id && (
                  <span className="rounded-full bg-orange-500 p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Details + urgency */}
      {step === 1 && (
        <div className="mt-4 px-4 space-y-5">
          {/* Selected category card */}
          {selectedCategory && (
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl">{selectedCategory.icon}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">TANLANGAN TUR</p>
                  <p className="text-sm font-bold text-gray-900">{selectedCategory.nameUz}</p>
                </div>
              </div>
              <button type="button" onClick={() => setStep(0)} className="text-xs font-semibold text-orange-500 hover:text-orange-600">
                O&apos;zgartirish
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">MUAMMO SARLAVHASI</label>
            <Input
              className="h-12 rounded-2xl border-0 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/30"
              placeholder="Masalan: Rakovina suv oqmoqda"
              {...register("title")}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">BATAFSIL TAVSIF</label>
            <Textarea
              className="min-h-[110px] rounded-2xl border-0 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/30"
              placeholder="Muammoni batafsil yozing..."
              {...register("description")}
            />
            {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {/* Urgency */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">SHOSHILINCHLIK DARAJASI</label>
            <div className="grid grid-cols-2 gap-3">
              {URGENCY_OPTIONS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setValue("urgency", u.value as ServiceRequestInput["urgency"])}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                    watchedUrgency === u.value ? u.activeColor : u.color
                  }`}
                >
                  <span className="text-lg">{u.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{u.label}</p>
                    <p className="text-[11px] text-gray-500">{u.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">RASM (IXTIYORIY)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setImagePreview(URL.createObjectURL(file))
              }}
            />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50 py-8 text-gray-400 transition hover:bg-gray-100 hover:text-gray-500"
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-xs font-semibold">Rasm qo&apos;shish</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Contact info + address */}
      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 px-4 space-y-5">
          {/* Name */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">ISMINGIZ</label>
            <Input
              className="h-12 rounded-2xl border-0 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/30"
              placeholder="Ismingizni kiriting"
              {...register("customerName")}
            />
            {errors.customerName && <p className="mt-1.5 text-xs text-red-500">{errors.customerName.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">TELEFON RAQAM</label>
            <Input
              className="h-12 rounded-2xl border-0 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/30"
              placeholder="+998 90 123 45 67"
              {...register("customerPhone")}
            />
            {errors.customerPhone && <p className="mt-1.5 text-xs text-red-500">{errors.customerPhone.message}</p>}
            {!profile?.phone && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600">
                <TriangleAlert className="h-3.5 w-3.5" />
                Telefon raqamini{" "}
                <Link className="font-bold underline" href="/account">Account</Link>{" "}
                bo&apos;limida saqlang.
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">MANZIL</label>
            <div className="relative">
              <Input
                className="h-12 rounded-2xl border-0 bg-gray-50 pr-10 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/30"
                placeholder="Kocha, uy, mo'ljal"
                {...register("address")}
              />
              <MapPin className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.address && <p className="mt-1.5 text-xs text-red-500">{errors.address.message}</p>}
          </div>

          {/* City */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">SHAHAR</label>
            <Select defaultValue="Toshkent" onValueChange={(v) => setValue("city", v)}>
              <SelectTrigger className="h-12 rounded-2xl border-0 bg-gray-50 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-12 flex-1 items-center justify-center rounded-full border-2 border-gray-200 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Orqaga
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>Yuborish <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Bottom nav buttons for steps 0 and 1 */}
      {step < 2 && (
        <div className="mt-6 flex gap-3 px-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 flex-1 items-center justify-center rounded-full border-2 border-gray-200 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
          >
            Orqaga
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-orange-500/40"
          >
            Keyingisi <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-400">Yuklanmoqda...</div>}>
      <RequestPageInner />
    </Suspense>
  )
}
