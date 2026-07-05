"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"
import { masterRegisterSchema, webCustomerRegisterSchema, type MasterRegisterInput, type WebCustomerRegisterInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Role = "customer" | "master"
interface Category { id: string; nameUz: string; icon: string }
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus"]

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<Role>("customer")
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const masterForm = useForm<MasterRegisterInput>({
    resolver: zodResolver(masterRegisterSchema),
    defaultValues: { serviceArea: "Toshkent", categories: [] },
  })

  const customerForm = useForm<WebCustomerRegisterInput>({
    resolver: zodResolver(webCustomerRegisterSchema),
  })

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {})
  }, [])

  const toggleCategory = (id: string) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id]
    setSelectedCategories(next)
    masterForm.setValue("categories", next)
  }

  const goNext = async () => {
    const valid = await masterForm.trigger(["fullName", "phone", "password"])
    if (valid) setStep(2)
  }

  const submitCustomer = async (data: WebCustomerRegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: "customer" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Xatolik")
      toast({ title: "Muvaffaqiyatli ro'yxatdan o'tdingiz!" })
      router.push("/auth/login?role=customer")
    } catch (err: unknown) {
      toast({ variant: "destructive", title: err instanceof Error ? err.message : "Xatolik" })
    } finally {
      setLoading(false)
    }
  }

  const submitMaster = async (data: MasterRegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Xatolik")
      toast({ title: "Muvaffaqiyatli ro'yxatdan o'tdingiz!" })
      router.push("/auth/login?role=master")
    } catch (err: unknown) {
      toast({ variant: "destructive", title: err instanceof Error ? err.message : "Xatolik" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center" style={{ backgroundColor: "#f0ede8" }}>
      {/* Top section */}
      <div className="w-full max-w-md px-6 pt-10 pb-2 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">UstaTanla</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Ro&apos;yxatdan o&apos;ting va eng yaxshi<br />xizmatlardan foydalaning.
        </p>
      </div>

      {/* Decorative gradient area */}
      <div className="w-full max-w-md px-6">
        <div
          className="h-32 w-full rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #0d9488 0%, #0ea5e9 40%, #a78bfa 70%, #f0ede8 100%)",
            opacity: 0.6,
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md px-6 -mt-6">
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          {/* Tab switcher */}
          <div className="mb-6 flex rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => { setRole("customer"); setStep(1) }}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all ${
                role === "customer"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              Mijoz
            </button>
            <button
              type="button"
              onClick={() => { setRole("master"); setStep(1) }}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all ${
                role === "master"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              Usta
            </button>
          </div>

          {/* Customer form */}
          {role === "customer" && (
            <form onSubmit={customerForm.handleSubmit(submitCustomer)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  To&apos;liq ism
                </label>
                <input
                  placeholder="Sarvar Karimov"
                  {...customerForm.register("fullName")}
                  className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                />
                {customerForm.formState.errors.fullName && (
                  <p className="mt-1 pl-4 text-[11px] text-red-500">{customerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 (—)— — — — — —"
                  {...customerForm.register("phone")}
                  className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                />
                {customerForm.formState.errors.phone && (
                  <p className="mt-1 pl-4 text-[11px] text-red-500">{customerForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  Parol
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kamida 6 ta belgi"
                    autoComplete="new-password"
                    {...customerForm.register("password")}
                    className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {customerForm.formState.errors.password && (
                  <p className="mt-1 pl-4 text-[11px] text-red-500">{customerForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-13 w-full items-center justify-center rounded-full py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "linear-gradient(to right, #ff6b2b, #e85d20)" }}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ro'yxatdan o'tish"}
              </button>

              <p className="text-center text-sm text-gray-500">
                Hisobingiz bormi?{" "}
                <Link href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700">
                  Kirish
                </Link>
              </p>
            </form>
          )}

          {/* Master form - Step 1 */}
          {role === "master" && step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Asosiy ma&apos;lumotlar</span>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-500">
                  1/2
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  To&apos;liq ism
                </label>
                <input
                  placeholder="Sarvar Karimov"
                  {...masterForm.register("fullName")}
                  className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                />
                {masterForm.formState.errors.fullName && (
                  <p className="mt-1 pl-4 text-[11px] text-red-500">{masterForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  Telefon raqami
                </label>
                <input
                  type="tel"
                  placeholder="+998 (—)— — — — — —"
                  {...masterForm.register("phone")}
                  className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                />
                {masterForm.formState.errors.phone && (
                  <p className="mt-1 pl-4 text-[11px] text-red-500">{masterForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  Parol
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kamida 6 ta belgi"
                    autoComplete="new-password"
                    {...masterForm.register("password")}
                    className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 pr-12 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {masterForm.formState.errors.password && (
                  <p className="mt-1 pl-4 text-[11px] text-red-500">{masterForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={goNext}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(to right, #ff6b2b, #e85d20)" }}
              >
                Davom etish <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-gray-500">
                Hisobingiz bormi?{" "}
                <Link href="/auth/login" className="font-semibold text-orange-600 hover:text-orange-700">
                  Kirish
                </Link>
              </p>
            </div>
          )}

          {/* Master form - Step 2 */}
          {role === "master" && step === 2 && (
            <form onSubmit={masterForm.handleSubmit(submitMaster)} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600"
                >
                  &larr; Orqaga
                </button>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-500">
                  2/2
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  Shahar
                </label>
                <select
                  onChange={(e) => masterForm.setValue("serviceArea", e.target.value)}
                  defaultValue="Toshkent"
                  className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-400/40 appearance-none"
                >
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  Kategoriyalar <span className="normal-case text-gray-400">(bir nechtasini tanlang)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const active = selectedCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2.5 text-left text-[12px] font-semibold transition-all",
                          active
                            ? "border-orange-400 bg-orange-50 text-orange-600"
                            : "border-gray-200 bg-[#f5f3f0] text-gray-600 hover:border-gray-300"
                        )}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.nameUz}</span>
                        {active && <CheckCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-orange-500" />}
                      </button>
                    )
                  })}
                </div>
                {masterForm.formState.errors.categories && (
                  <p className="mt-1 text-[11px] text-red-500">{masterForm.formState.errors.categories.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                  O&apos;zingiz haqingizda <span className="normal-case text-gray-400">(ixtiyoriy)</span>
                </label>
                <textarea
                  placeholder="Tajriba, ko'nikmalar..."
                  rows={3}
                  {...masterForm.register("bio")}
                  className="w-full rounded-2xl border-0 bg-[#f5f3f0] px-5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-13 w-full items-center justify-center rounded-full py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "linear-gradient(to right, #ff6b2b, #e85d20)" }}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ro'yxatdan o'tish"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* OR divider */}
      <div className="flex w-full max-w-md items-center gap-3 px-6 py-5">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-xs font-bold tracking-wider text-gray-400">YOKI</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      {/* Social buttons */}
      <div className="flex w-full max-w-md gap-3 px-6">
        <button
          type="button"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      {/* Footer text */}
      <div className="w-full max-w-md px-8 pt-6 pb-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-relaxed">
          Ro&apos;yxatdan o&apos;tish orqali siz bizning foydalanish shartlari va maxfiylik siyosatiga rozilik bildirasiz.
        </p>
      </div>
    </div>
  )
}
