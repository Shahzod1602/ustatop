"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Loader2, ArrowLeft, User, Wrench } from "lucide-react"
import { masterLoginSchema, webCustomerLoginSchema, type MasterLoginInput, type WebCustomerRegisterInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"

type Role = "customer" | "master" | null

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(false)

  // Pre-select role from URL ?role=customer
  useEffect(() => {
    const r = searchParams.get("role")
    if (r === "customer" || r === "master") setRole(r)
  }, [searchParams])

  const masterForm = useForm<MasterLoginInput>({
    resolver: zodResolver(masterLoginSchema),
  })

  const customerForm = useForm<Pick<WebCustomerRegisterInput, "phone" | "password">>({
    resolver: zodResolver(webCustomerLoginSchema),
  })

  const handleMasterLogin = async (data: MasterLoginInput) => {
    setLoading(true)
    try {
      const result = await signIn("credentials", { phone: data.phone, password: data.password, redirect: false })
      if (result?.error) throw new Error("Telefon raqam yoki parol noto'g'ri")
      toast({ title: "Xush kelibsiz!" })
      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      toast({ variant: "destructive", title: err instanceof Error ? err.message : "Xatolik" })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerLogin = async (data: { phone: string; password: string }) => {
    setLoading(true)
    try {
      const result = await signIn("customer-credentials", { phone: data.phone, password: data.password, redirect: false })
      if (result?.error) throw new Error("Telefon raqam yoki parol noto'g'ri")
      toast({ title: "Xush kelibsiz!" })
      router.push("/")
      router.refresh()
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
          <button onClick={() => setRole(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">UstaTop</p>
          <p className="text-[15px] font-bold text-white">Kirish</p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-10">

        {/* ── Role selector ── */}
        {!role && (
          <div className="mt-4">
            <h1 className="mb-2 text-[26px] font-extrabold leading-tight text-white">Kimсiz?</h1>
            <p className="mb-8 text-[13px] text-white/50">Hisobingizga kirish uchun turni tanlang</p>

            <div className="space-y-3">
              <button
                onClick={() => setRole("customer")}
                className="group w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-blue-400/50 hover:bg-blue-500/10 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">Oddiy foydalanuvchi</p>
                    <p className="text-[12px] text-white/40">Usta qidirish va so&apos;rov yuborish</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRole("master")}
                className="group w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-amber-400/50 hover:bg-amber-500/10 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">Usta</p>
                    <p className="text-[12px] text-white/40">Dashboard va so&apos;rovlarni boshqarish</p>
                  </div>
                </div>
              </button>
            </div>

            <p className="mt-8 text-center text-[13px] text-white/40">
              Hisobingiz yo&apos;qmi?{" "}
              <Link href="/auth/register" className="font-semibold text-white/80 hover:text-white">
                Ro&apos;yxatdan o&apos;ting
              </Link>
            </p>
          </div>
        )}

        {/* ── Customer login ── */}
        {role === "customer" && (
          <div className="mt-4">
            <h1 className="mb-1 text-[22px] font-extrabold text-white">Xush kelibsiz</h1>
            <p className="mb-6 text-[12px] text-blue-400">Oddiy foydalanuvchi</p>

            <form onSubmit={customerForm.handleSubmit(handleCustomerLogin)} className="space-y-3">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirish"}
              </button>
            </form>
          </div>
        )}

        {/* ── Master login ── */}
        {role === "master" && (
          <div className="mt-4">
            <h1 className="mb-1 text-[22px] font-extrabold text-white">Xush kelibsiz</h1>
            <p className="mb-6 text-[12px] text-amber-400">Usta</p>

            <form onSubmit={masterForm.handleSubmit(handleMasterLogin)} className="space-y-3">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...masterForm.register("password")}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-amber-400/60"
                />
                {masterForm.formState.errors.password && (
                  <p className="mt-1 text-[11px] text-red-400">{masterForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-[14px] font-bold text-gray-900 transition-all hover:bg-amber-300 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirish"}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-white/40">
              Admin?{" "}
              <Link href="/admin/login" className="font-semibold text-white/60 hover:text-white">Admin kirish</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
