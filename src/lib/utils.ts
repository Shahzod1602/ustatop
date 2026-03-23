import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatPhone(phone: string): string {
  // Format Uzbek phone numbers: +998 XX XXX XX XX
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("998") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
  }
  return phone
}

export function getUrgencyLabel(urgency: string): string {
  const labels: Record<string, string> = {
    LOW: "Oddiy",
    MEDIUM: "O'rta",
    HIGH: "Muhim",
    URGENT: "Juda shoshilinch",
  }
  return labels[urgency] || urgency
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Kutilmoqda",
    MATCHED: "Ustalar topildi",
    ACCEPTED: "Qabul qilindi",
    IN_PROGRESS: "Jarayonda",
    COMPLETED: "Yakunlandi",
    CANCELLED: "Bekor qilindi",
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    MATCHED: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function getUrgencyColor(urgency: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  }
  return colors[urgency] || "bg-gray-100 text-gray-800"
}
