"use client"

import { useMemo, useState, useEffect, useCallback, useTransition } from "react"
import { toast } from "sonner"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TenderFilters, type ConfidenceRange, type StatusFilter } from "@/components/tenders/tender-filters"
import { TendersTable } from "@/components/tenders/tenders-table"
import { TenderDetailSheet } from "@/components/tenders/tender-detail-sheet"
import { type Tender, parseBudgetToWan } from "@/lib/mock-data"

export type BudgetRange = [number | null, number | null]

interface TendersViewProps {
  initialTenders?: any[]
  initialKeywords?: any[]
  total?: number
  page?: number
  pageSize?: number
  initialQuery?: string
  initialStatus?: string
  initialConfidence?: [number, number]
  initialDate?: string
  initialSort?: string
  initialProcurementType?: string
}

export function TendersView({
  initialTenders = [],
  initialKeywords = [],
  total = 0,
  page = 1,
  pageSize = 50,
  initialQuery = "",
  initialStatus = "all",
  initialConfidence = [0, 100],
  initialDate = "",
  initialSort = "confidence",
  initialProcurementType = "",
}: TendersViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [tenders, setTenders] = useState<Tender[]>(initialTenders)
  const [budgetRange, setBudgetRange] = useState<BudgetRange>([null, null])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    setTenders(initialTenders)
    const hasAnalyzing = initialTenders.some(
      (t) => t.confidence === 0 || t.reason === "AI 分析中..."
    )
    if (hasAnalyzing) {
      const timer = setInterval(() => router.refresh(), 3000)
      return () => clearInterval(timer)
    }
  }, [initialTenders, router])

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("page")
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === "all") {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      })
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router]
  )

  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (p <= 1) {
        params.delete("page")
      } else {
        params.set("page", String(p))
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router]
  )

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const filteredByBudget = useMemo(() => {
    const [minWan, maxWan] = budgetRange
    if (minWan === null && maxWan === null) return tenders
    return tenders.filter((t) => {
      const wan = parseBudgetToWan(t.budget)
      if (minWan !== null && wan < minWan) return false
      if (maxWan !== null && wan > maxWan) return false
      return true
    })
  }, [tenders, budgetRange])

  const todayMinguo = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear() - 1911}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`
  }, [])

  const currentDate = initialDate || todayMinguo

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(
        `/api/cron/scrape?force=true&manual=true&date=${encodeURIComponent(currentDate)}`
      )
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        router.refresh()
      } else {
        toast.error("更新失敗：" + data.error)
      }
    } catch {
      toast.error("無法連線至更新伺服器")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    setConfirmClear(false)
    setIsClearing(true)
    try {
      const res = await fetch("/api/tenders/clear")
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setTenders([])
        router.refresh()
      } else {
        toast.error("刪除失敗：" + (data.error || "未知錯誤"))
      }
    } catch (e: any) {
      toast.error("無法連線至伺服器: " + e.message)
    } finally {
      setIsClearing(false)
    }
  }

  const handleReAnalyze = async () => {
    setIsAnalyzing(true)
    setTenders((prev) =>
      prev.map((t) => ({ ...t, confidence: 0, reason: "AI 分析中..." }))
    )
    toast.info("AI 重新分析中，請稍候...")
    try {
      const res = await fetch("/api/cron/analyze?force=true&manual=true")
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        router.refresh()
      } else {
        toast.error("分析失敗：" + data.error)
      }
    } catch {
      toast.error("無法連線至分析伺服器")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredByBudget.length === 0) {
      toast.error("目前無資料可供匯出")
      return
    }
    const headers = ["機關名稱", "標案名稱", "預算金額", "招標方式", "採購方式", "公告日期", "截止日期", "AI信心度", "網址"]
    const rows = filteredByBudget.map((t) => {
      const td = t as any
      return [
        td.agency, td.title, String(td.budget).replace(/,/g, ""),
        td.biddingType, td.procurementType, td.releaseDate,
        td.dueDate, td.confidence, td.url,
      ]
    })
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `智能標案匯出_${todayMinguo.replace(/\//g, "")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV 匯出成功")
  }

  const active = activeId ? tenders.find((t) => t.id === activeId) ?? null : null

  const toggleFavorite = (id: string) => {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: Tender["status"] = t.status === "favorited" ? "new" : "favorited"
        toast.success(next === "favorited" ? "已加入收藏清單" : "已從收藏移除")
        return { ...t, status: next }
      })
    )
  }

  const toggleIgnore = (id: string) => {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: Tender["status"] = t.status === "ignored" ? "new" : "ignored"
        toast(next === "ignored" ? "已標記為忽略" : "已取消忽略")
        return { ...t, status: next }
      })
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">正向關鍵字：</span>
          <div className="flex flex-wrap gap-1">
            {initialKeywords.filter((k: any) => k.type === "positive").map((k: any) => (
              <Badge key={k.id} variant="outline" className="bg-primary/5 text-primary border-primary/20">{k.word}</Badge>
            ))}
            {initialKeywords.filter((k: any) => k.type === "positive").length === 0 && (
              <span className="text-xs text-muted-foreground">未設定</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">負向排除：</span>
          <div className="flex flex-wrap gap-1">
            {initialKeywords.filter((k: any) => k.type === "negative").map((k: any) => (
              <Badge key={k.id} variant="outline" className="bg-destructive/5 text-destructive border-destructive/20">{k.word}</Badge>
            ))}
            {initialKeywords.filter((k: any) => k.type === "negative").length === 0 && (
              <span className="text-xs text-muted-foreground">未設定</span>
            )}
          </div>
        </div>
      </div>

      <Card className={`overflow-hidden p-0 transition-opacity ${isPending ? "opacity-70" : ""}`}>
        <TenderFilters
          query={initialQuery}
          onQueryChange={(q) => updateParams({ query: q })}
          status={initialStatus as StatusFilter}
          onStatusChange={(s) => updateParams({ status: s })}
          confidence={initialConfidence as ConfidenceRange}
          onConfidenceChange={(c) =>
            updateParams({
              confidence_min: c[0] === 0 ? "" : String(c[0]),
              confidence_max: c[1] === 100 ? "" : String(c[1]),
            })
          }
          date={currentDate}
          onDateChange={(d) => updateParams({ date: d })}
          procurementType={initialProcurementType}
          onProcurementTypeChange={(pt) => {
            // "all" 保留在 URL 讓 page.tsx 知道要顯示全部，空字串則刪除（回到預設勞務類）
            const params = new URLSearchParams(searchParams.toString())
            params.delete("page")
            if (!pt || pt === "勞務類") {
              params.delete("procurementType")
            } else {
              params.set("procurementType", pt)
            }
            startTransition(() => router.push(`${pathname}?${params.toString()}`))
          }}
          sort={initialSort}
          onSortChange={(s) => updateParams({ sort: s === "confidence" ? "" : s })}
          budgetRange={budgetRange}
          onBudgetRangeChange={setBudgetRange}
          totalCount={total}
          filteredCount={filteredByBudget.length + (total - tenders.length)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onClearAll={handleClearAll}
          isClearing={isClearing}
          confirmClear={confirmClear}
          onExport={handleExportCSV}
          onReAnalyze={handleReAnalyze}
          isAnalyzing={isAnalyzing}
        />
        <TendersTable
          tenders={filteredByBudget}
          onView={(t) => { setActiveId(t.id); setSheetOpen(true) }}
          onToggleFavorite={toggleFavorite}
          onToggleIgnore={toggleIgnore}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              第 {page} / {totalPages} 頁，共 {total} 筆
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || isPending}
                className="h-8 gap-1"
              >
                <ChevronLeft className="size-3.5" />
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || isPending}
                className="h-8 gap-1"
              >
                下一頁
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TenderDetailSheet
        tender={active}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onToggleFavorite={toggleFavorite}
        onToggleIgnore={toggleIgnore}
      />
    </>
  )
}
