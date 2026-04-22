"use client"

import { useState } from "react"
import { Mail, Plus, Trash2, UserPlus, Send } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEffect } from "react"

export interface Recipient {
  id: string
  name: string
  email: string
  isEnabled: boolean
}

export function RecipientManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const load = () => {
    fetch("/api/settings/recipients")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecipients(data)
        } else {
          console.error("Invalid recipients data:", data)
          setRecipients([])
        }
      })
      .catch(err => {
        console.error("Failed to load recipients:", err)
        setRecipients([])
      })
  }

  useEffect(() => {
    load()
  }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("請輸入有效的 Email 格式")
      return
    }
    
    try {
      const res = await fetch("/api/settings/recipients", {
        method: "POST",
        body: JSON.stringify({ name, email, isEnabled: true })
      })
      if (res.ok) {
        setName("")
        setEmail("")
        toast.success(`已新增收件人：${name}`)
        load()
      }
    } catch {
      toast.error("新增失敗")
    }
  }

  const toggle = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/settings/recipients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: !currentStatus })
      })
      load()
    } catch {
      toast.error("狀態更新失敗")
    }
  }

  const remove = async (id: string) => {
    if (!confirm("確定要移除此收件人嗎？")) return
    try {
      await fetch(`/api/settings/recipients/${id}`, { method: "DELETE" })
      toast.success("已移除收件人")
      load()
    } catch {
      toast.error("移除失敗")
    }
  }

  const handleTestEmail = async (r: Recipient) => {
    const tid = toast.loading(`正在向 ${r.email} 發送測試郵件...`)
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        body: JSON.stringify({ email: r.email, name: r.name })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message, { id: tid })
      } else {
        toast.error("發送失敗：" + data.error, { id: tid })
      }
    } catch {
      toast.error("網路錯誤，無法發送測試信", { id: tid })
    }
  }


  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4 text-primary" />
          收件人管理
        </CardTitle>
        <CardDescription>
          管理接收情報 Email 的對象，停用的收件人將不會收到推播通知。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-5">
        <form
          onSubmit={add}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_auto]"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-name" className="text-xs">
              姓名
            </Label>
            <Input
              id="rec-name"
              placeholder="王小明"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-email" className="text-xs">
              Email
            </Label>
            <Input
              id="rec-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full gap-1.5 sm:w-auto">
              <Plus className="size-3.5" />
              新增收件人
            </Button>
          </div>
        </form>

        <ul role="list" className="flex flex-col divide-y divide-border rounded-md border border-border">
          {recipients.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                aria-hidden
              >
                <Mail className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{r.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {r.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-primary hover:bg-primary/10"
                  onClick={() => handleTestEmail(r)}
                  title="發送測試信"
                >
                  <Send className="size-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`toggle-${r.id}`}
                    checked={r.isEnabled}
                    onCheckedChange={() => toggle(r.id, r.isEnabled)}
                    aria-label={`切換 ${r.name} 的通知`}
                  />
                  <Label
                    htmlFor={`toggle-${r.id}`}
                    className="hidden text-xs text-muted-foreground sm:inline"
                  >
                    {r.isEnabled ? "啟用" : "停用"}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(r.id)}
                  aria-label={`移除 ${r.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
