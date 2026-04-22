"use client"

import { useState } from "react"
import { Plus, X, Check, Loader2 } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"

interface KeywordManagerProps {
  title: string
  description: string
  variant: "positive" | "negative"
  initial: string[]
  suggestions?: string[]
}

export function KeywordManager({
  title,
  description,
  variant,
  initial,
  suggestions = [],
}: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<string[]>(initial)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const add = async (term: string) => {
    const clean = term.trim()
    if (!clean) return
    if (keywords.includes(clean)) {
      toast.error(`關鍵字「${clean}」已存在`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: clean, type: variant })
      })
      
      if (!res.ok) throw new Error("新增失敗")

      setKeywords((prev) => [...prev, clean])
      setInput("")
      toast.success(`已新增${variant === "positive" ? "正向" : "負向"}關鍵字：${clean}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const remove = async (word: string) => {
    try {
      const res = await fetch("/api/keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word })
      })

      if (!res.ok) throw new Error("移除失敗")

      setKeywords((prev) => prev.filter((k) => k !== word))
      toast(`已移除關鍵字：${word}`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const availableSuggestions = suggestions.filter(
    (s) => !keywords.includes(s),
  )

  const accent =
    variant === "positive"
      ? {
          dot: "bg-primary",
          chip: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
          removeHover: "hover:bg-primary/20",
        }
      : {
          dot: "bg-destructive",
          chip: "bg-destructive/8 text-destructive border-destructive/20 hover:bg-destructive/12",
          removeHover: "hover:bg-destructive/15",
        }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-border">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className={cn("size-2 rounded-full", accent.dot)} aria-hidden />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {keywords.length} 組
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add(input)
          }}
        >
          <Input
            placeholder={
              variant === "positive"
                ? "新增搜尋關鍵字，例如：系統、平台、AI…"
                : "新增排除關鍵字，例如：維護、冷氣、保全…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label={`新增${variant === "positive" ? "正向" : "負向"}關鍵字`}
          />
          <Button type="submit" className="gap-1.5" disabled={!input.trim() || loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            新增
          </Button>
        </form>

        {availableSuggestions.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">快速加入</span>
            <div className="flex flex-wrap gap-1.5">
              {availableSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-solid hover:bg-muted hover:text-foreground"
                >
                  <Plus className="size-3" aria-hidden />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <Separator />

        {keywords.length === 0 ? (
          <Empty className="py-4">
            <EmptyHeader>
              <EmptyTitle>尚未設定關鍵字</EmptyTitle>
              <EmptyDescription>
                新增關鍵字以讓 AI 與爬蟲依此規則運作。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span
                key={k}
                className={cn(
                  "group inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm",
                  accent.chip,
                )}
              >
                <Check className="size-3" aria-hidden />
                <span>{k}</span>
                <button
                  type="button"
                  onClick={() => remove(k)}
                  className={cn(
                    "ml-0.5 inline-flex size-4 items-center justify-center rounded",
                    accent.removeHover,
                  )}
                  aria-label={`移除關鍵字 ${k}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
