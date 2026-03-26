"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, MapPin, Plus, TriangleAlert } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { serviceRequestSchema, type ServiceRequestInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"

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
      urgency: "URGENT",
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
    <div className="min-h-screen px-3 pb-4 pt-safe text-slate-100">
      <header className="surface-card fade-up mb-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg">Buyurtma yuborish</h1>
            <p className="text-xs text-slate-400">Muammoni aniq yozing, tezroq usta topiladi</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="surface-card fade-up stagger-1 space-y-3 p-3.5">
        <div className="surface-card-soft rounded-2xl p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">1-qadam</p>
          <p className="mt-0.5 text-sm font-bold text-slate-100">Muammo ma'lumoti</p>

          <div className="mt-3 space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs font-bold text-slate-400">Muammo</Label>
              <Input className="h-11 rounded-xl border-white/10 bg-[#101826]" placeholder="Masalan: Rakovina suv oqmoqda" {...register("title")} />
              {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-slate-400">Tavsif</Label>
              <Textarea className="min-h-[95px] rounded-xl border-white/10 bg-[#101826]" placeholder="Muammoni batafsil yozing..." {...register("description")} />
              {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        <div className="surface-card-soft rounded-2xl p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">2-qadam</p>
          <p className="mt-0.5 text-sm font-bold text-slate-100">Lokatsiya va shoshilinchlik</p>

          <div className="mt-3 space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs font-bold text-slate-400">Manzil</Label>
              <div className="relative">
                <Input className="h-11 rounded-xl border-white/10 bg-[#101826] pr-10" placeholder="Kocha, uy, moljal" {...register("address")} />
                <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
              {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address.message}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-slate-400">Shahar</Label>
              <Select defaultValue="Toshkent" onValueChange={(v) => setValue("city", v)}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-[#101826]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-bold text-slate-400">Shoshilinchlik</Label>
              <Select defaultValue="URGENT" onValueChange={(v) => setValue("urgency", v as ServiceRequestInput["urgency"])}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-[#101826]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="surface-card-soft rounded-2xl p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">3-qadam</p>
          <p className="mt-0.5 text-sm font-bold text-slate-100">Aloqa ma'lumoti</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Input className="h-10 rounded-xl border-white/10 bg-[#0f1623]" placeholder="Ismingiz" {...register("customerName")} />
            <Input className="h-10 rounded-xl border-white/10 bg-[#0f1623]" placeholder="+998..." {...register("customerPhone")} />
          </div>

          {!profile?.phone && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300">
              <TriangleAlert className="h-3.5 w-3.5" />
              Telefon raqamini <a className="font-bold underline" href="/account">Account</a> bo'limida saqlang.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-white/20 bg-[#101826] p-4">
          <button
            type="button"
            className="mx-auto flex h-16 w-24 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-slate-400"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        <button type="submit" disabled={loading} className="action-amber mt-2 flex h-12 w-full items-center justify-center text-base disabled:opacity-70">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buyurtma yuborish"}
        </button>
      </form>
    </div>
  )
}

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Yuklanmoqda...</div>}>
      <RequestPageInner />
    </Suspense>
  )
}
