import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfidenceIndicator } from "@/components/confidence-indicator"
import { formatBudget, daysUntil } from "@/lib/mock-data"

export function RecentHighValue({ tenders = [] }: { tenders?: any[] }) {
  const items = [...tenders]
    .filter((t) => t.status !== "ignored")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-border">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">AI 推薦高價值標案</CardTitle>
          <CardDescription>今日信心度最高的前 5 件</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1 -mr-2">
          <Link href="/tenders">
            全部案件
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-border">
          {items.map((t) => {
            const remaining = daysUntil(t.dueDate || t.deadline)
            return (
              <li
                key={t.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-3.5" aria-hidden />
                    <span className="truncate">{t.agency}</span>
                  </div>
                  <Link
                    href="/tenders"
                    className="truncate text-sm font-medium leading-snug hover:text-primary"
                  >
                    {t.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {t.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="h-5 px-1.5 text-[11px] font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1.5 sm:items-end">
                  <ConfidenceIndicator score={t.confidence} />
                  <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
                    <span>預算 {formatBudget(t.budget)}</span>
                    <span aria-hidden>•</span>
                    <span
                      className={
                        remaining <= 3
                          ? "font-medium text-destructive"
                          : remaining <= 7
                            ? "font-medium text-warning-foreground"
                            : ""
                      }
                    >
                      剩 {Math.max(0, remaining)} 天
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
