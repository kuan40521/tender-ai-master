import { Download } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { TendersView } from "@/components/tenders/tenders-view"
import { db } from "@/lib/db"
import { mockTenders } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'

export default async function TendersPage() {
  let tenders = []
  let keywords = []

  try {
    const [fetchedTenders, fetchedKeywords] = await Promise.all([
      db.tender.findMany({ orderBy: { createdAt: "desc" } }),
      db.keyword.findMany()
    ])
    tenders = fetchedTenders
    keywords = fetchedKeywords
  } catch (error) {
    console.error("Database connection failed, using mock data:", error)
    tenders = mockTenders
    keywords = []
  }

  // Prisma 取出的 tags 是 JSON string，要還原給前端 Array
  const formattedTenders = tenders.map(t => ({
    ...t,
    tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags
  }))

  return (
    <div className="flex flex-col">
      <PageHeader
        title="智能標案列表"
        description="經 AI 語義分析與正負向關鍵字篩選後的高潛力商機清單，點擊列表項目可查看詳細資訊。"
      />
      <div className="px-4 py-5 md:px-6 md:py-6">
        <TendersView initialTenders={formattedTenders} initialKeywords={keywords} />
      </div>
    </div>
  )
}
