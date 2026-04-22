import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "帳號", type: "text" },
        password: { label: "密碼", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        // 快速模式 / 資料庫離線備援：允許 admin/admin123 直接登入
        if (credentials.username === "admin" && credentials.password === "admin123") {
          return {
            id: "admin-id",
            name: "系統管理員",
            email: "admin@example.com",
          }
        }

        try {
          const user = await db.user.findUnique({
            where: { username: credentials.username }
          })

          if (!user || !user.password) return null

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

          return {
            id: user.id,
            name: user.name || user.username,
            email: user.email,
          }
        } catch (error) {
          console.error("Database connection failed during login:", error)
          return null
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
