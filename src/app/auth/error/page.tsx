import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <CardTitle>Autentifikatsiya xatoligi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Tizimga kirishda xatolik yuz berdi. Qayta urinib ko'ring.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button asChild>
              <Link href="/auth/login">Qayta kirish</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Bosh sahifa</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
