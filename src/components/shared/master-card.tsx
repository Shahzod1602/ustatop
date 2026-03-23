import Link from "next/link"
import { MapPin, CheckCircle, Phone } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/shared/star-rating"

interface MasterCardProps {
  id: string
  fullName: string
  phone: string
  profilePhoto?: string | null
  serviceArea: string
  rating: number
  reviewCount: number
  isVerified: boolean
  categories: { nameUz: string; icon: string }[]
  pricing?: string | null
}

export function MasterCard({
  id,
  fullName,
  phone,
  profilePhoto,
  serviceArea,
  rating,
  reviewCount,
  isVerified,
  categories,
  pricing,
}: MasterCardProps) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profilePhoto ?? ""} alt={fullName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isVerified && (
              <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-blue-500 fill-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-base leading-tight">{fullName}</h3>
                {isVerified && (
                  <span className="text-xs text-blue-600 font-medium">Tasdiqlangan usta</span>
                )}
              </div>
              {pricing && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">{pricing}</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(rating)} size="sm" readonly />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount} sharh)</span>
            </div>

            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {serviceArea}
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {categories.slice(0, 3).map((cat) => (
                  <Badge key={cat.nameUz} variant="secondary" className="text-xs">
                    {cat.icon} {cat.nameUz}
                  </Badge>
                ))}
                {categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{categories.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/masters/${id}`}>Profil</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4 mr-1" />
              Bog&apos;lanish
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
