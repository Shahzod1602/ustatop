"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ImagePlus, Loader2, MapPin, X, TriangleAlert } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  { value: "LOW", label: "Oddiy" },
  { value: "MEDIUM", label: "Orta" },
  { value: "HIGH", label: "Muhim" },
  { value: "URGENT", label: "Tezda" },
]

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Fargona", "Qarshi", "Nukus"]

function RequestPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categorySlug = searchParams.get("category")

  const {
    register,
    handleSubmit,
    setValue,
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
    () => categories.find((c) => c.slug === categorySlug) ?? categories[0],
    [categories, categorySlug]
  )

  useEffect(() => {
    if (selectedCategory) setValue("categoryId", selectedCategory.id)
  }, [selectedCategory, setValue])

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

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-4 text-[#3a3a3a]">
      <header className="bg-[#ff6b2b] px-3 pt-safe pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="rounded-xl bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Buyurtma yuborish</h1>
            <p className="text-xs text-white/70">Muammoni aniq yozing, tezroq usta topiladi</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="surface-card fade-up mx-3 mt-3 space-y-3 p-3.5">

        {/* Step 1 */}
        <div className="surface-card-soft rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c8c8c]">1-qadam</p>
          <p className="mt-0.5 text-sm font-bold text-[#3a3a3a]">Muammo ma'lumoti</p>

          <div className="mt-3 space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs font-bold text-[#5a5a5a]">Muammo</Label>
              <Input
                className="h-11 rounded-xl border-[#e9e9e9] bg-white text-[#3a3a3a] focus:border-[#ff6b2b]"
                placeholder="Masalan: Rakovina suv oqmoqda"
                {...register("title")}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-[#5a5a5a]">Tavsif</Label>
              <Textarea
                className="min-h-[95px] rounded-xl border-[#e9e9e9] bg-white text-[#3a3a3a] focus:border-[#ff6b2b]"
                placeholder="Muammoni batafsil yozing..."
                {...register("description")}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="surface-card-soft rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c8c8c]">2-qadam</p>
          <p className="mt-0.5 text-sm font-bold text-[#3a3a3a]">Lokatsiya va shoshilinchlik</p>

          <div className="mt-3 space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs font-bold text-[#5a5a5a]">Manzil</Label>
              <div className="relative">
                <Input
                  className="h-11 rounded-xl border-[#e9e9e9] bg-white pr-10 text-[#3a3a3a] focus:border-[#ff6b2b]"
                  placeholder="Kocha, uy, moljal"
                  {...register("address")}
                />
                <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c8c8c]" />
              </div>
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-[#5a5a5a]">Shahar</Label>
              <Select defaultValue="Toshkent" onValueChange={(v) => setValue("city", v)}>
                <SelectTrigger className="h-11 rounded-xl border-[#e9e9e9] bg-white text-[#3a3a3a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-[#5a5a5a]">Shoshilinchlik</Label>
              <Select defaultValue="MEDIUM" onValueChange={(v) => setValue("urgency", v as ServiceRequestInput["urgency"])}>
                <SelectTrigger className="h-11 rounded-xl border-[#e9e9e9] bg-white text-[#3a3a3a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="surface-card-soft rounded-xl p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c8c8c]">3-qadam</p>
          <p className="mt-0.5 text-sm font-bold text-[#3a3a3a]">Aloqa ma'lumoti</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Input
              className="h-10 rounded-xl border-[#e9e9e9] bg-white text-[#3a3a3a] focus:border-[#ff6b2b]"
              placeholder="Ismingiz"
              {...register("customerName")}
            />
            <Input
              className="h-10 rounded-xl border-[#e9e9e9] bg-white text-[#3a3a3a] focus:border-[#ff6b2b]"
              placeholder="+998..."
              {...register("customerPhone")}
            />
          </div>

          {!profile?.phone && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600">
              <TriangleAlert className="h-3.5 w-3.5" />
              Telefon raqamini{" "}
              <Link className="font-bold underline" href="/account">Account</Link>{" "}
              bo'limida saqlang.
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div className="rounded-xl border border-dashed border-[#e0e0e0] bg-[#fafafa] p-3">
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
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" className="h-36 w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e0e0e0] bg-white py-5 text-[#8c8c8c] transition hover:border-[#ff6b2b]/50 hover:text-[#5a5a5a]"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs font-semibold">Rasm qo'shish (ixtiyoriy)</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="action-primary mt-2 flex h-12 w-full items-center justify-center text-base disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buyurtma yuborish"}
        </button>
      </form>
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-[#8c8c8c]">Yuklanmoqda...</div>}>
      <RequestPageInner />
    </Suspense>
  )
}
