"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { masterLoginSchema, type MasterLoginInput } from "@/lib/validations"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MasterLoginInput>({
    resolver: zodResolver(masterLoginSchema),
  })

  const onSubmit = async (data: MasterLoginInput) => {
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        phone: data.phone,
        redirect: false,
      })

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Kirish muvaffaqiyatsiz",
          description: result.error,
        })
        return
      }

      toast({ title: "Muvaffaqiyatli kirdingiz!" })
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast({ variant: "destructive", title: "Xatolik", description: "Qayta urinib ko'ring" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Usta tizimga kirish</CardTitle>
        <CardDescription>Telefon raqamingizni kiriting</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+998901234567"
              autoComplete="tel"
              {...register("phone")}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kirilmoqda...</> : "Kirish"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Hisobingiz yo&apos;qmi?{" "}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            <Link href="/" className="hover:underline">Bosh sahifaga qaytish</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
