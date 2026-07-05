/**
 * In-memory per-user flow state. Simple by design for the scaffold.
 * NOTE: not persistent across restarts — swap for grammY sessions / Redis in prod.
 */

export interface UstaOnboarding {
  step: "phone" | "categories" | "location" | "city" | "price"
  fullName?: string
  phone?: string
  categoryIds: string[]
  latitude?: number
  longitude?: number
  city?: string
}

export interface MijozRequestDraft {
  step: "category" | "city" | "location" | "phone" | "description"
  categoryId?: string
  categoryName?: string
  city?: string
  latitude?: number
  longitude?: number
  fullName?: string
  phone?: string
}

const ustaFlows = new Map<number, UstaOnboarding>()
const mijozFlows = new Map<number, MijozRequestDraft>()

export const ustaState = {
  get: (id: number) => ustaFlows.get(id),
  set: (id: number, s: UstaOnboarding) => ustaFlows.set(id, s),
  clear: (id: number) => ustaFlows.delete(id),
}

export const mijozState = {
  get: (id: number) => mijozFlows.get(id),
  set: (id: number, s: MijozRequestDraft) => mijozFlows.set(id, s),
  clear: (id: number) => mijozFlows.delete(id),
}
