import {
  Briefcase,
  Sparkles,
  AlarmClock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { parseMinguoDate } from "@/lib/mock-data"

interface Kpi {
  label: string
  value: string
  unit?: string
  delta?: { value: string; direction: "up" | "down" | "flat"; label: string }
  icon: React.ElementType
  tint: "primary" | "success" | "warning" | "muted"
}

const tintMap: Record<Kpi["tint"], { wrap: string; icon: string }> = {
  primary: {
    wrap: "bg-primary/10 text-primary",
    icon: "text-primary",
  },
  success: {
    wrap: "bg-success/12 text-success",
    icon: "text-success",
  },
  warning: {
    wrap: "bg-warning/20 text-warning-foreground",
    icon: "text-warning-foreground",
  },
  muted: {
    wrap: "bg-muted text-foreground",
    icon: "text-muted-foreground",
  },
}

export function KpiCards({ tenders = [] }: { tenders?: any[] }) {
  const highValueCount = tenders.filter(t => t.confidence >= 80).length
  const totalCount = tenders.length
  const upcomingCount = tenders.filter(t => {
    // 使用專門的 Parser 來計算民國年
    const dStr = t.dueDate || t.deadline || ""
    const d = parseMinguoDate(dStr)
    if (isNaN(d.getTime())) return false
    const diff = (d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 3
  }).length

  const dynamicKpis: Kpi[] = [
    {
      label: "系統累積標案總數",
      value: totalCount.toString(),
      unit: "件",
      delta: { value: "目前進度", direction: "flat", label: "累計總量" },
      icon: Briefcase,
      tint: "primary",
    },
    {
      label: "AI 高價值案件",
      value: highValueCount.toString(),
      unit: "件",
      delta: { value: "信心度 > 80%", direction: "up", label: "重點關注" },
      icon: Sparkles,
      tint: "success",
    },
    {
      label: "即將截止案件",
      value: upcomingCount.toString(),
      unit: "件",
      delta: { value: "3 天內截止", direction: "flat", label: "需即刻評估" },
      icon: AlarmClock,
      tint: "warning",
    },
    {
      label: "7 日高價值趨勢",
      value: "100%",
      delta: { value: "系統初始化", direction: "up", label: "新資料導入" },
      icon: TrendingUp,
      tint: "muted",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {dynamicKpis.map((kpi) => {
        const Icon = kpi.icon
        const tints = tintMap[kpi.tint]
        return (
          <Card key={kpi.label} className="overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {kpi.label}
                </span>
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md",
                    tints.wrap,
                  )}
                  aria-hidden
                >
                  <Icon className={cn("size-[18px]", tints.icon)} />
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tabular-nums tracking-tight">
                  {kpi.value}
                </span>
                {kpi.unit ? (
                  <span className="text-sm text-muted-foreground">
                    {kpi.unit}
                  </span>
                ) : null}
              </div>

              {kpi.delta ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium tabular-nums",
                      kpi.delta.direction === "up" &&
                        "bg-success/12 text-success",
                      kpi.delta.direction === "down" &&
                        "bg-destructive/10 text-destructive",
                      kpi.delta.direction === "flat" &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {kpi.delta.direction === "up" ? (
                      <ArrowUpRight className="size-3" aria-hidden />
                    ) : kpi.delta.direction === "down" ? (
                      <ArrowDownRight className="size-3" aria-hidden />
                    ) : null}
                    {kpi.delta.value}
                  </span>
                  <span className="text-muted-foreground">
                    {kpi.delta.label}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
