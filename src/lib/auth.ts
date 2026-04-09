import NextAuth from "next-auth"
import type { DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { adminLoginSchema, masterLoginSchema } from "@/lib/validations"
import { authConfig } from "@/lib/auth.config"

// ─── Type augmentation ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      isVerified: boolean
      role: "MASTER" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    isVerified?: boolean
    role?: "MASTER" | "ADMIN"
  }
}

// ─── Full config (Node.js runtime only) ──────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    // Master login
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        const parsed = masterLoginSchema.safeParse(credentials)
        if (!parsed.success) throw new Error("Noto'g'ri ma'lumotlar kiritildi")

        const { phone, password } = parsed.data
        const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`

        const master = await prisma.master.findUnique({
          where: { phone: normalizedPhone },
          select: { id: true, email: true, fullName: true, isVerified: true, isActive: true, password: true },
        })

        if (!master) throw new Error("Telefon raqam yoki parol noto'g'ri")
        if (!master.isActive) throw new Error("Akkauntingiz bloklangan. Administrator bilan bog'laning")

        const ok = await bcryptjs.compare(password, master.password)
        if (!ok) throw new Error("Telefon raqam yoki parol noto'g'ri")

        return {
          id: master.id,
          email: master.email,
          name: master.fullName,
          isVerified: master.isVerified,
          role: "MASTER" as const,
        }
      },
    }),

    // Admin login
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminLoginSchema.safeParse(credentials)
        if (!parsed.success) throw new Error("Noto'g'ri ma'lumotlar kiritildi")

        const { email, password } = parsed.data

        const admin = await prisma.adminUser.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: { id: true, email: true, name: true, password: true },
        })

        if (!admin) throw new Error("Email yoki parol noto'g'ri")

        const ok = await bcryptjs.compare(password, admin.password)
        if (!ok) throw new Error("Email yoki parol noto'g'ri")

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          isVerified: true,
          role: "ADMIN" as const,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.isVerified = user.isVerified as boolean
        token.role = user.role as "MASTER" | "ADMIN"
      }
      // Refresh isVerified on each token check for masters
      if (token.id && token.role === "MASTER") {
        const master = await prisma.master.findUnique({
          where: { id: token.id as string },
          select: { isVerified: true, fullName: true },
        })
        if (master) {
          token.isVerified = master.isVerified
          token.name = master.fullName
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.isVerified = token.isVerified as boolean
        session.user.role = token.role as "MASTER" | "ADMIN"
      }
      return session
    },
  },

  debug: process.env.NODE_ENV === "development",
})
