"use client"

import { useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"
import { TenderFilters, type ConfidenceRange, type StatusFilter } from "@/components/tenders/tender-filters"
import { TendersTable } from "@/components/tenders/tenders-table"
import { TenderDetailSheet } from "@/components/tenders/tender-detail-sheet"
import { type Tender } from "@/lib/mock-data"

import { Badge } from "@/components/ui/badge"

export function TendersView({ 
  initialTenders = [], 
  initialKeywords = [] 
}: { 
  initialTenders?: any[], 
  initialKeywords?: any[] 
}) {
  const [tenders, setTenders] = useState<Tender[]>(initialTenders.length > 0 ? initialTenders : [])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [confidence, setConfidence] = useState<ConfidenceRange>([0, 100])
  
  // 建立今日民國年日期 (例如 113/04/21)
  const todayMinguo = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear() - 1911}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`
  }, [])

  const [dateFilter, setDateFilter] = useState<string>(todayMinguo)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    setTenders(initialTenders)
    
    // 如果還有標案在「分析中」，啟動自動輪詢
    const hasAnalyzing = initialTenders.some(t => t.confidence === 0 || t.reason === "AI 分析中...")
    if (hasAnalyzing) {
      const timer = setInterval(() => {
        router.refresh()
      }, 3000)
      return () => clearInterval(timer)
    }
  }, [initialTenders, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // 加入 force=true 確保手動點擊時能直接執行，不受排程時間限制
      // 加入 manual=true 讓正式環境允許手動觸發
      // 加入 date 參數傳遞前端設定的民國日期 (例如 113/04/22)
      const res = await fetch(`/api/cron/scrape?force=true&manual=true&date=${encodeURIComponent(dateFilter)}`)
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        router.refresh() // 觸發 Next.js 重新執行 page.tsx 的伺服器端資料獲取
      } else {
        toast.error("更新失敗：" + data.error)
      }
    } catch (error) {
      toast.error("無法連線至更新伺服器")
    } finally {
      setIsRefreshing(false)
    }
  }
  const handleClearAll = async () => {
    if (!confirmClear) {
      // 第一次點擊：顯示確認提示
      setConfirmClear(true)
      // 3 秒後自動取消確認狀態
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    // 第二次點擊：真正執行刪除
    setConfirmClear(false)
    setIsClearing(true)
    try {
      // 使用 GET 方式，確保任何環境都能正常呼叫
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
    toast.info("AI 重新分析中，請稍候...")
    try {
      // 加入 force=true 強制重新分析現有標案，以便套用新的過濾邏輯
      // 加入 manual=true 讓正式環境允許手動觸發
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tenders
      .filter((t) => {
        if (status !== "all" && t.status !== status) return false
        if (t.confidence < confidence[0] || t.confidence > confidence[1])
          return false
        if (dateFilter && t.releaseDate !== dateFilter) return false
        if (!q) return true
        return (
          t.title.toLowerCase().includes(q) ||
          t.agency.toLowerCase().includes(q) ||
          t.tags.some((tag: string) => tag.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.confidence - a.confidence)
  }, [tenders, query, status, confidence, dateFilter])

  const active = activeId ? tenders.find((t) => t.id === activeId) ?? null : null

  const openDetail = (t: Tender) => {
    setActiveId(t.id)
    setSheetOpen(true)
  }

  const toggleFavorite = (id: string) => {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: Tender["status"] =
          t.status === "favorited" ? "new" : "favorited"
        toast.success(
          next === "favorited" ? "已加入收藏清單" : "已從收藏移除",
        )
        return { ...t, status: next }
      }),
    )
  }

  const toggleIgnore = (id: string) => {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const next: Tender["status"] =
          t.status === "ignored" ? "new" : "ignored"
        toast(next === "ignored" ? "已標記為忽略" : "已取消忽略")
        return { ...t, status: next }
      }),
    )
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("目前無資料可供匯出")
      return
    }

    const headers = ["機關名稱", "標案名稱", "預算金額", "招標方式", "採購方式", "公告日期", "截止日期", "AI信心度", "網址"]
    const rows = filtered.map(t => [
      t.agency,
      t.title,
      t.budget.replace(/,/g, ""),
      t.biddingType,
      t.procurementType,
      t.releaseDate,
      t.dueDate,
      t.confidence,
      t.url
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `智能標案匯出_${todayMinguo.replace(/\//g, "")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV 匯出成功")
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
            {initialKeywords.filter((k: any) => k.type === "positive").length === 0 && <span className="text-xs text-muted-foreground">未設定</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">負向排除：</span>
          <div className="flex flex-wrap gap-1">
            {initialKeywords.filter((k: any) => k.type === "negative").map((k: any) => (
              <Badge key={k.id} variant="outline" className="bg-destructive/5 text-destructive border-destructive/20">{k.word}</Badge>
            ))}
            {initialKeywords.filter((k: any) => k.type === "negative").length === 0 && <span className="text-xs text-muted-foreground">未設定</span>}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <TenderFilters
          query={query}
          onQueryChange={setQuery}
          status={status}
          onStatusChange={setStatus}
          confidence={confidence}
          onConfidenceChange={setConfidence}
          date={dateFilter}
          onDateChange={setDateFilter}
          totalCount={tenders.length}
          filteredCount={filtered.length}
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
          tenders={filtered}
          onView={openDetail}
          onToggleFavorite={toggleFavorite}
          onToggleIgnore={toggleIgnore}
        />
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
