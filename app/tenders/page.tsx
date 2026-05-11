import { PageHeader } from "@/components/page-header"
import { TendersView } from "@/components/tenders/tenders-view"
import { db } from "@/lib/db"
import { mockTenders } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const query = params.query ?? ""
  const status = params.status ?? "all"
  const confidenceMin = parseInt(params.confidence_min ?? "0")
  const confidenceMax = parseInt(params.confidence_max ?? "100")
  const date = params.date ?? ""
  const sort = params.sort ?? "confidence"

  let tenders: any[] = []
  let keywords: any[] = []
  let total = 0

  try {
    // 系統僅處理勞務類標案，硬性條件不開放使用者切換
    const where: Record<string, unknown> = {
      confidence: { gte: confidenceMin, lte: confidenceMax },
      procurementType: { contains: "勞務類" },
    }
    if (status !== "all") where.status = status
    if (date) where.releaseDate = date
    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { agency: { contains: query, mode: "insensitive" } },
      ]
    }

    const orderBy =
      sort === "dueDate" ? { dueDate: "asc" as const } :
      sort === "createdAt" ? { createdAt: "desc" as const } :
      { confidence: "desc" as const }

    const [fetchedTenders, fetchedKeywords, count] = await Promise.all([
      db.tender.findMany({
        where,
        orderBy,
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      db.keyword.findMany(),
      db.tender.count({ where }),
    ])
    tenders = fetchedTenders
    keywords = fetchedKeywords
    total = count
  } catch (error) {
    console.error("Database connection failed, using mock data:", error)
    tenders = mockTenders
    keywords = []
    total = mockTenders.length
  }

  const formattedTenders = tenders.map((t: any) => ({
    ...t,
    tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
  }))

  return (
    <div className="flex flex-col">
      <PageHeader
        title="智能標案列表"
        description="經 AI 語義分析與正負向關鍵字篩選後的高潛力商機清單，點擊列表項目可查看詳細資訊。"
      />
      <div className="px-4 py-5 md:px-6 md:py-6">
        <TendersView
          initialTenders={formattedTenders}
          initialKeywords={keywords}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          initialQuery={query}
          initialStatus={status}
          initialConfidence={[confidenceMin, confidenceMax]}
          initialDate={date}
          initialSort={sort}
        />
      </div>
    </div>
  )
}
