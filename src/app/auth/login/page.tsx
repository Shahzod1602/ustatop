"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { masterLoginSchema, webCustomerLoginSchema, type MasterLoginInput, type WebCustomerRegisterInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"

type Role = "customer" | "master"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [role, setRole] = useState<Role>("customer")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const activeForm = role === "master" ? masterForm : customerForm
  const activeHandler = role === "master" ? handleMasterLogin : handleCustomerLogin

  return (
    <div className="flex min-h-screen flex-col items-center" style={{ backgroundColor: "#f0ede8" }}>
      {/* Top section */}
      <div className="w-full max-w-md px-6 pt-10 pb-2 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">UstaTanla</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Xush kelibsiz! Tizimga kiring va eng yaxshi<br />mutaxassislarni toping.
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
              onClick={() => setRole("customer")}
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
              onClick={() => setRole("master")}
              className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all ${
                role === "master"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              Usta
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={activeForm.handleSubmit(activeHandler as Parameters<typeof activeForm.handleSubmit>[0])}
            className="space-y-4"
          >
            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                Telefon raqami
              </label>
              <input
                type="tel"
                placeholder="+998 (—)— — — — — —"
                {...activeForm.register("phone")}
                className="h-12 w-full rounded-full border-0 bg-[#f5f3f0] px-5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
              />
              {activeForm.formState.errors.phone && (
                <p className="mt-1 pl-4 text-[11px] text-red-500">{activeForm.formState.errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolingizni kiriting"
                  autoComplete="current-password"
                  {...activeForm.register("password")}
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
              {activeForm.formState.errors.password && (
                <p className="mt-1 pl-4 text-[11px] text-red-500">{activeForm.formState.errors.password.message}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button type="button" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                Parolni unutdingizmi?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-13 w-full items-center justify-center rounded-full py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(to right, #ff6b2b, #e85d20)" }}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kirish"}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
              Hisobingiz yo&apos;qmi?{" "}
              <Link href="/auth/register" className="font-semibold text-orange-600 hover:text-orange-700">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </p>
          </form>
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
          Kirish orqali siz bizning foydalanish shartlari va maxfiylik siyosatiga rozilik bildirasiz.
        </p>
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
