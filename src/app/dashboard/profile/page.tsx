"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, ShieldCheck, ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StarRating } from "@/components/shared/star-rating"
import { masterProfileSchema, type MasterProfileInput } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus"]

interface MasterProfile {
  id: string
  fullName: string
  email: string
  phone: string
  bio: string | null
  serviceArea: string
  isVerified: boolean
  rating: number
  reviewCount: number
  categories: { category: { id: string; nameUz: string; icon: string } }[]
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<MasterProfileInput>({
    resolver: zodResolver(masterProfileSchema),
  })

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/masters/${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        reset({
          fullName: data.fullName,
          phone: data.phone,
          bio: data.bio ?? "",
          serviceArea: data.serviceArea,
        })
      })
      .catch(() => toast({ variant: "destructive", title: "Profil yuklanmadi" }))
      .finally(() => setLoading(false))
  }, [session, reset, toast])

  const onSubmit = async (data: MasterProfileInput) => {
    if (!session?.user?.id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/masters/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Xatolik")
      setProfile((prev) => prev ? { ...prev, ...data } : prev)
      toast({ title: "Profil yangilandi!" })
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Xatolik", description: err instanceof Error ? err.message : "Qayta urinib ko'ring" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  )

  const initials = profile?.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl heading-gradient">Profilim</h1>

      {/* Profile summary card */}
      <Card className="surface-card border-0 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">{profile?.fullName}</h2>
              <p className="text-sm text-slate-400">{profile?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                {profile?.isVerified ? (
                  <Badge className="border-emerald-300/40 bg-emerald-400/15 text-emerald-200">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Tasdiqlangan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300/35 bg-amber-400/10 text-amber-200">
                    <ShieldX className="h-3 w-3 mr-1" /> Tasdiq kutilmoqda
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <StarRating value={Math.round(profile?.rating ?? 0)} size="sm" readonly />
                  <span className="text-sm font-medium text-slate-200">{profile?.rating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">({profile?.reviewCount} sharh)</span>
                </div>
              </div>
            </div>
          </div>

          {profile?.categories && profile.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.categories.map(({ category }) => (
                <Badge key={category.id} variant="secondary">
                  {category.icon} {category.nameUz}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="surface-card border-0 bg-transparent">
        <CardHeader><CardTitle>Profilni tahrirlash</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="fullName">To&apos;liq ism *</Label>
                <Input id="fullName" className="border-white/10 bg-[#101826]" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Telefon *</Label>
                <Input id="phone" className="border-white/10 bg-[#101826]" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Xizmat hududi *</Label>
              <Select
                defaultValue={profile?.serviceArea ?? "Toshkent"}
                onValueChange={(v) => setValue("serviceArea", v)}
              >
                <SelectTrigger className="border-white/10 bg-[#101826]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pricing">Narx ma&apos;lumoti (ixtiyoriy)</Label>
              <Input id="pricing" className="border-white/10 bg-[#101826]" placeholder="50,000 — 200,000 so'm" {...register("pricing")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" className="min-h-[100px] border-white/10 bg-[#101826]" placeholder="Tajriba va ko'nikmalaringiz haqida..." {...register("bio")} />
            </div>

            <Button type="submit" disabled={saving} className="bg-[linear-gradient(180deg,#67d6dc_0%,#4caebf_100%)] text-[#07131b] hover:brightness-105">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saqlanmoqda...</> : <><Save className="h-4 w-4 mr-2" />Saqlash</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
