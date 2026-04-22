import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/app-shell"
import { TextSizeProvider } from "@/components/providers/text-size-provider"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const notoTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-tc",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Tender AI — 政府採購情報分析系統",
  description:
    "自動化收集與分析政府電子採購網招標資訊，AI 語義分析精準篩選 ICT 系統建置高潛力商機。",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geist.variable} ${geistMono.variable} ${notoTC.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AuthProvider>
          <TextSizeProvider>
            <AppShell>{children}</AppShell>
            <Toaster richColors position="top-right" />
            {process.env.NODE_ENV === "production" && <Analytics />}
          </TextSizeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
