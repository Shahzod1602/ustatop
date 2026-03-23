"use client"

import { useEffect, useMemo, useState } from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, MapPin, Plus } from "lucide-react"
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

const URGENCY_OPTIONS = [
  { value: "LOW", label: "Oddiy (Low)" },
  { value: "MEDIUM", label: "O'rta (Medium)" },
  { value: "HIGH", label: "Muhim (High)" },
  { value: "URGENT", label: "Tezda (Urgent)" },
]

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus"]

function RequestPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
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
      customerName: "Nargiza",
      customerPhone: "+998901112233",
      title: "Rakovina suv oqmoqda",
      description: "Krondan suv tomyapti, tuzatish kerak",
      address: "Chilonzor, Toshkent",
      categoryId: "",
    },
  })

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

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
        description: err instanceof Error ? err.message : "Qayta urinib ko'ring",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <header className="bg-[#1d57b8] px-4 pb-3 pt-safe pt-5 text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="rounded-lg p-1.5 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-extrabold">Buyurtma Yuborish</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 px-4 py-4">
        <div>
          <Label className="mb-1.5 block text-xs font-bold text-slate-600">Muammo:</Label>
          <Input className="h-11 rounded-xl border-slate-300 bg-white" {...register("title")} />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-bold text-slate-600">Tavsif:</Label>
          <Textarea className="min-h-[88px] rounded-xl border-slate-300 bg-white" {...register("description")} />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-bold text-slate-600">Lokatsiya:</Label>
          <div className="relative">
            <Input className="h-11 rounded-xl border-slate-300 bg-white pr-10" {...register("address")} />
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
          {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-bold text-slate-600">Shahar:</Label>
          <Select defaultValue="Toshkent" onValueChange={(v) => setValue("city", v)}>
            <SelectTrigger className="h-11 rounded-xl border-slate-300 bg-white">
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
          <Label className="mb-1.5 block text-xs font-bold text-slate-600">Shoshilinchlik:</Label>
          <Select defaultValue="URGENT" onValueChange={(v) => setValue("urgency", v as ServiceRequestInput["urgency"])}>
            <SelectTrigger className="h-11 rounded-xl border-slate-300 bg-white">
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

        <div className="rounded-xl border border-dashed border-slate-300 bg-[#f8fbff] p-4">
          <button
            type="button"
            className="mx-auto flex h-16 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-500"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input className="h-11 rounded-xl border-slate-300 bg-white" placeholder="Ismingiz" {...register("customerName")} />
          <Input className="h-11 rounded-xl border-slate-300 bg-white" placeholder="+998..." {...register("customerPhone")} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(180deg,#ffcb45_0%,#f4b52c_100%)] text-base font-extrabold text-[#163a70] shadow disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buyurtma Yuborish"}
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
