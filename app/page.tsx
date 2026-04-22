import { CalendarClock, Download } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { CrawlerStatus } from "@/components/dashboard/crawler-status"
import { TrendsChart } from "@/components/dashboard/trends-chart"
import { RecentHighValue } from "@/components/dashboard/recent-high-value"

import { db } from "@/lib/db"
import { mockTenders } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let tenders = []
  let logs = []
  let configs = []

  try {
    tenders = await db.tender.findMany({
      orderBy: { createdAt: "desc" },
    })

    logs = await db.crawlerLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" }
    })

    configs = await db.config.findMany()
  } catch (error) {
    console.error("Database connection failed, using mock data:", error)
    tenders = mockTenders
    logs = []
    configs = []
  }

  const formattedTenders = tenders.map(t => ({
    ...t,
    tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags
  }))

  return (
    <div className="flex flex-col">
      <PageHeader
        title="儀表板"
        description="今日政府採購網情報總覽：AI 判定高價值案件、爬蟲運作狀態與近 7 日趨勢。"
        actions={
          <>
            <div className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground md:inline-flex">
              <CalendarClock className="size-3.5" aria-hidden />
              <span className="tabular-nums">2026-04-21（二）</span>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" />
              匯出日報
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <KpiCards tenders={formattedTenders} />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <TrendsChart tenders={formattedTenders} />
          </div>
          <div className="xl:col-span-2">
            <CrawlerStatus logs={logs} configs={configs} />
          </div>
        </div>

        <RecentHighValue tenders={formattedTenders} />
      </div>
    </div>
  )
}
