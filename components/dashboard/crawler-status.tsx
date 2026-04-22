"use client"

import * as React from "react"
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface CrawlerLog {
  id: string
  date: string
  time: string
  status: string
  message?: string
  fetchedCount: number
  filteredCount: number
}

const statusMap: Record<
  string,
  {
    icon: React.ElementType
    label: string
    dot: string
    text: string
    bg: string
  }
> = {
  success: {
    icon: CheckCircle2,
    label: "成功",
    dot: "bg-success",
    text: "text-success",
    bg: "bg-success/10",
  },
  warning: {
    icon: AlertTriangle,
    label: "警告",
    dot: "bg-warning",
    text: "text-warning-foreground",
    bg: "bg-warning/20",
  },
  failed: {
    icon: XCircle,
    label: "失敗",
    dot: "bg-destructive",
    text: "text-destructive",
    bg: "bg-destructive/10",
  },
}

export function CrawlerStatus({ logs = [], configs = [] }: { logs?: any[], configs?: any[] }) {
  const router = useRouter()
  const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]))
  const scrapeTimes = JSON.parse(configMap.scrapeTimes || '["10:00", "14:00", "17:00"]')

  // 計算下次執行時間
  const nextRun = React.useMemo(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    // 將所有時間點轉為分鐘數
    const times = scrapeTimes.map((t: string) => {
      const [h, m] = t.split(':').map(Number)
      return { time: t, minutes: h * 60 + m }
    }).sort((a: any, b: any) => a.minutes - b.minutes)

    // 尋找下一個時間點
    const next = times.find((t: any) => t.minutes > currentMinutes)
    if (next) return next.time
    
    // 如果今天都跑完了，就是明天的第一個
    return times[0]?.time
  }, [scrapeTimes])

  const [isExecuting, setIsExecuting] = React.useState(false)
  const handleManualRun = async () => {
    if (isExecuting) return
    setIsExecuting(true)
    try {
      const res = await fetch("/api/cron/scrape?force=true&manual=true")
      const data = await res.json()
      if (data.success) {
        toast.success(data.addedCount > 0 ? `成功抓取並新增 ${data.addedCount} 筆標案` : "抓取完成，今日無新增標案")
        router.refresh()
      } else {
        toast.error("執行失敗：" + (data.error || "未知錯誤"))
      }
    } catch (e) {
      toast.error("無法連線至後端伺服器")
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-border">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">爬蟲狀態監控</CardTitle>
          <CardDescription className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block p-1 bg-muted rounded text-[10px] font-bold">自動排程</span>
              每日 {scrapeTimes.join(" / ")} 執行
            </div>
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <span className="inline-block p-1 bg-primary/10 rounded text-[10px] font-bold">下次待辦</span>
              準備於 {nextRun} 開始執行
            </div>
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleManualRun} className="gap-1.5" disabled={isExecuting}>
          <RefreshCw className={cn("size-3.5", isExecuting && "animate-spin")} />
          手動執行
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-border">
          {logs.length === 0 && (
             <li className="px-5 py-8 text-center text-sm text-muted-foreground">
               尚無執行紀錄
             </li>
          )}
          {logs.map((run) => {
            const s = statusMap[run.status] || statusMap.failed
            const Icon = s.icon
            return (
              <li
                key={run.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md",
                      s.bg,
                    )}
                    aria-hidden
                  >
                    <Icon className={cn("size-4", s.text)} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {run.time}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                          s.bg,
                          s.text,
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {run.date} - {run.message}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-12 sm:pl-0">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">
                      抓取
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {run.fetchedCount}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">
                      符合關鍵字
                    </span>
                    <span className="text-sm font-medium tabular-nums text-primary">
                      {run.filteredCount}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
