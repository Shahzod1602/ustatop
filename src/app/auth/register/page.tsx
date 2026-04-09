"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2, ArrowLeft, ArrowRight, User, Wrench } from "lucide-react"
import { masterRegisterSchema, webCustomerRegisterSchema, type MasterRegisterInput, type WebCustomerRegisterInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Role = "customer" | "master" | null
interface Category { id: string; nameUz: string; icon: string }
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus"]

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<Role>(null)
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Master form
  const masterForm = useForm<MasterRegisterInput>({
    resolver: zodResolver(masterRegisterSchema),
    defaultValues: { serviceArea: "Toshkent", categories: [] },
  })

  // Customer form
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
    <div className="flex min-h-screen flex-col" style={{ background: "linear-gradient(160deg,#0f1923 0%,#1a2d45 60%,#0f1923 100%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        {role ? (
          <button onClick={() => { setRole(null); setStep(1) }} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">UstaTop</p>
          <p className="text-[15px] font-bold text-white">Ro&apos;yxatdan o&apos;tish</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-10">

        {/* ── STEP 0: Role selector ── */}
        {!role && (
          <div className="mt-4">
            <h1 className="mb-2 text-[26px] font-extrabold leading-tight text-white">
              Kimсiz?
            </h1>
            <p className="mb-8 text-[13px] text-white/50">Rolni tanlang — keyin mos shaklni to&apos;ldirasiz</p>

            <div className="space-y-3">
              {/* Customer card */}
              <button
                onClick={() => setRole("customer")}
                className="group w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-blue-400/50 hover:bg-blue-500/10 active:scale-[0.98]"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 transition-colors group-hover:bg-blue-500/30">
                  <User className="h-6 w-6" />
                </div>
                <p className="text-[17px] font-extrabold text-white">Oddiy foydalanuvchi</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                  Usta qidirish, so&apos;rov yuborish, xizmatlar bilan tanishish
                </p>
                <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-blue-400">
                  Davom etish <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>

              {/* Master card */}
              <button
                onClick={() => setRole("master")}
                className="group w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-amber-400/50 hover:bg-amber-500/10 active:scale-[0.98]"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 transition-colors group-hover:bg-amber-500/30">
                  <Wrench className="h-6 w-6" />
                </div>
                <p className="text-[17px] font-extrabold text-white">Usta</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/50">
                  Xizmat ko&apos;rsatish, e&apos;lon joylash, mijozlar bilan ishlash
                </p>
                <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-amber-400">
                  Davom etish <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            </div>

            <p className="mt-8 text-center text-[13px] text-white/40">
              Hisobingiz bormi?{" "}
              <Link href="/auth/login" className="font-semibold text-white/80 hover:text-white">Kirish</Link>
            </p>
          </div>
        )}

        {/* ── Customer form ── */}
        {role === "customer" && (
          <div className="mt-4">
            <h1 className="mb-1 text-[22px] font-extrabold text-white">Hisob yaratish</h1>
            <p className="mb-6 text-[12px] text-blue-400">Oddiy foydalanuvchi</p>

            <form onSubmit={customerForm.handleSubmit(submitCustomer)} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/60">To&apos;liq ism</label>
                <input
                  placeholder="Sarvar Karimov"
                  {...customerForm.register("fullName")}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-blue-400/60 focus:bg-white/8"
                />
                {customerForm.formState.errors.fullName && (
                  <p className="mt-1 text-[11px] text-red-400">{customerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/60">Telefon raqam</label>
                <input
                  type="tel"
                  placeholder="+998901234567"
                  {...customerForm.register("phone")}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-blue-400/60"
                />
                {customerForm.formState.errors.phone && (
                  <p className="mt-1 text-[11px] text-red-400">{customerForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/60">Parol</label>
                <input
                  type="password"
                  placeholder="Kamida 6 ta belgi"
                  autoComplete="new-password"
                  {...customerForm.register("password")}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-blue-400/60"
                />
                {customerForm.formState.errors.password && (
                  <p className="mt-1 text-[11px] text-red-400">{customerForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-blue-400 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ro'yxatdan o'tish"}
              </button>
            </form>
          </div>
        )}

        {/* ── Master form ── */}
        {role === "master" && (
          <div className="mt-4">
            <div className="mb-6 flex items-center gap-2">
              <h1 className="text-[22px] font-extrabold text-white">
                {step === 1 ? "Asosiy ma'lumotlar" : "Mutaxassislik"}
              </h1>
              <span className="ml-auto rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                {step}/2
              </span>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/60">To&apos;liq ism</label>
                  <input
                    placeholder="Sarvar Karimov"
                    {...masterForm.register("fullName")}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-amber-400/60"
                  />
                  {masterForm.formState.errors.fullName && (
                    <p className="mt-1 text-[11px] text-red-400">{masterForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/60">Telefon raqam</label>
                  <input
                    type="tel"
                    placeholder="+998901234567"
                    {...masterForm.register("phone")}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-amber-400/60"
                  />
                  {masterForm.formState.errors.phone && (
                    <p className="mt-1 text-[11px] text-red-400">{masterForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/60">Parol</label>
                  <input
                    type="password"
                    placeholder="Kamida 6 ta belgi"
                    autoComplete="new-password"
                    {...masterForm.register("password")}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-amber-400/60"
                  />
                  {masterForm.formState.errors.password && (
                    <p className="mt-1 text-[11px] text-red-400">{masterForm.formState.errors.password.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-[14px] font-bold text-gray-900 transition-all hover:bg-amber-300 active:scale-[0.98]"
                >
                  Davom etish <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={masterForm.handleSubmit(submitMaster)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/60">Shahar</label>
                  <select
                    onChange={(e) => masterForm.setValue("serviceArea", e.target.value)}
                    defaultValue="Toshkent"
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#1a2d45] px-4 text-[14px] text-white outline-none focus:border-amber-400/60"
                  >
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-white/60">
                    Kategoriyalar * <span className="text-white/30">(bir nechtasini tanlang)</span>
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
                              ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                          )}
                        >
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.nameUz}</span>
                          {active && <CheckCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-400" />}
                        </button>
                      )
                    })}
                  </div>
                  {masterForm.formState.errors.categories && (
                    <p className="mt-1 text-[11px] text-red-400">{masterForm.formState.errors.categories.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/60">
                    O&apos;zingiz haqingizda <span className="text-white/30">(ixtiyoriy)</span>
                  </label>
                  <textarea
                    placeholder="Tajriba, ko'nikmalar..."
                    rows={3}
                    {...masterForm.register("bio")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] text-white placeholder-white/30 outline-none focus:border-amber-400/60 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-[14px] font-bold text-gray-900 transition-all hover:bg-amber-300 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ro'yxatdan o'tish"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
