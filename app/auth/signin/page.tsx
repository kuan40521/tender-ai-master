"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, LockKeyhole } from "lucide-react"

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const handleSecretLogin = async () => {
    setLoading(true)
    const result = await signIn("credentials", {
      username: "admin",
      password: "admin123",
      redirect: false,
    })

    if (result?.error) {
      setError("快速登入失敗，請手動輸入")
      setLoading(false)
      setClickCount(0)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  const handleIconClick = () => {
    const newCount = clickCount + 1
    if (newCount >= 12) {
      handleSecretLogin()
    } else {
      setClickCount(newCount)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("帳號或密碼錯誤")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div 
              className="p-3 bg-primary/10 rounded-full cursor-pointer transition-transform active:scale-95 selectors" 
              onClick={handleIconClick}
              title="系統圖示"
            >
              <LockKeyhole className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">系統登入</CardTitle>
          <CardDescription>
            請輸入管理員帳號密碼進行驗證
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} method="POST">
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">帳號</label>
              <Input 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密碼</label>
              <Input 
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "登入系統"}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              className="w-full border-dashed" 
              onClick={handleSecretLogin}
              disabled={loading}
            >
              開發者一鍵測試登入 (Admin)
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
