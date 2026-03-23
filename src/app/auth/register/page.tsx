"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { masterRegisterSchema, type MasterRegisterInput } from "@/lib/validations"
import { cn } from "@/lib/utils"

interface Category { id: string; nameUz: string; icon: string }
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus"]

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<MasterRegisterInput>({
    resolver: zodResolver(masterRegisterSchema),
    defaultValues: { serviceArea: "Toshkent", categories: [] },
  })

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {})
  }, [])

  const toggleCategory = (id: string) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id]
    setSelectedCategories(next)
    setValue("categories", next)
  }

  const goNextStep = async () => {
    const valid = await trigger(["fullName", "email", "password", "confirmPassword", "phone"])
    if (valid) setStep(2)
  }

  const onSubmit = async (data: MasterRegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Xatolik yuz berdi")

      toast({ title: "Muvaffaqiyatli ro'yxatdan o'tdingiz!", description: "Endi tizimga kiring." })
      router.push("/auth/login")
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Xatolik", description: err instanceof Error ? err.message : "Qayta urinib ko'ring" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Usta bo&apos;lish</CardTitle>
        <CardDescription>
          {step === 1 ? "Hisob ma'lumotlaringizni kiriting" : "Professional ma'lumotlaringizni kiriting"}
        </CardDescription>
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-3">
          {[1, 2].map((s) => (
            <div key={s} className={cn("h-2 w-12 rounded-full transition-colors", step >= s ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="fullName">To&apos;liq ism *</Label>
                <Input id="fullName" placeholder="Sarvar Karimov" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="usta@example.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone">Telefon raqam *</Label>
                <Input id="phone" placeholder="+998901234567" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Parol *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Kamida 6 ta belgi"
                    {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Parolni tasdiqlang *</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="button" className="w-full" onClick={goNextStep}>
                Davom etish <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Orqaga
              </button>

              <div className="space-y-1">
                <Label>Xizmat hududi *</Label>
                <Select defaultValue="Toshkent" onValueChange={(v) => setValue("serviceArea", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.serviceArea && <p className="text-xs text-destructive">{errors.serviceArea.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Mutaxassislik kategoriyalari * (bir nechtasini tanlang)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors",
                        selectedCategories.includes(cat.id)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span className="font-medium truncate">{cat.nameUz}</span>
                      {selectedCategories.includes(cat.id) && <CheckCircle className="h-3.5 w-3.5 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((id) => {
                      const cat = categories.find((c) => c.id === id)
                      return cat ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {cat.icon} {cat.nameUz}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
                {errors.categories && <p className="text-xs text-destructive">{errors.categories.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio">O&apos;zingiz haqingizda (ixtiyoriy)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tajriba, ko'nikmalar, ishingiz haqida..."
                  className="min-h-[80px]"
                  {...register("bio")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pricing">Narx ma&apos;lumoti (ixtiyoriy)</Label>
                <Input id="pricing" placeholder="Masalan: 50,000 — 200,000 so'm" {...register("pricing")} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saqlanmoqda...</> : "Ro'yxatdan o'tish"}
              </Button>
            </div>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">Kirish</Link>
        </p>
      </CardContent>
    </Card>
  )
}
