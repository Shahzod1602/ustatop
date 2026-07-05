import NextAuth from "next-auth"
import type { DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import {
  validateMasterCredentials,
  validateCustomerCredentials,
  validateAdminCredentials,
  validateTelegramWebApp,
} from "@/lib/auth-helpers"

// ─── Type augmentation ────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      isVerified: boolean
      role: "MASTER" | "ADMIN" | "CUSTOMER"
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    isVerified?: boolean
    role?: "MASTER" | "ADMIN" | "CUSTOMER"
  }
}

// ─── Full config (Node.js runtime only) ──────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        const user = await validateMasterCredentials(
          credentials?.phone as string,
          credentials?.password as string
        )
        return user
      },
    }),

    CredentialsProvider({
      id: "customer-credentials",
      name: "Customer Credentials",
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        const user = await validateCustomerCredentials(
          credentials?.phone as string,
          credentials?.password as string
        )
        return user
      },
    }),

    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(credentials) {
        const user = await validateAdminCredentials(
          credentials?.email as string,
          credentials?.password as string
        )
        return user
      },
    }),

    CredentialsProvider({
      id: "telegram-webapp",
      name: "Telegram",
      credentials: {
        initData: { label: "initData", type: "text" },
      },
      async authorize(credentials) {
        return await validateTelegramWebApp(credentials?.initData as string)
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
      // Refresh isVerified on each token check for masters only
      if (token.id && token.role === "MASTER") {
        const master = await prisma.master.findUnique({
          where: { id: token.id as string },
          select: { isVerified: true, fullName: true },
        })
        if (!master) {
          token.role = undefined
          return token
        }
        token.isVerified = master.isVerified
        token.name = master.fullName
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
