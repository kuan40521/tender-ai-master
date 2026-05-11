import { PageHeader } from "@/components/page-header"
import { TendersView } from "@/components/tenders/tenders-view"
import { db } from "@/lib/db"
import { mockTenders } from "@/lib/mock-data"

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function TendersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1"))
  const query = searchParams.query ?? ""
  const status = searchParams.status ?? "all"
  const confidenceMin = parseInt(searchParams.confidence_min ?? "0")
  const confidenceMax = parseInt(searchParams.confidence_max ?? "100")
  const date = searchParams.date ?? ""
  const sort = searchParams.sort ?? "confidence"
  // "all" = 顯示全部；未設定時預設只顯示勞務類
  const procurementType = searchParams.procurementType ?? "勞務類"

  let tenders: any[] = []
  let keywords: any[] = []
  let total = 0

  try {
    const where: Record<string, unknown> = {
      confidence: { gte: confidenceMin, lte: confidenceMax },
    }
    if (status !== "all") where.status = status
    if (date) where.releaseDate = date
    if (procurementType && procurementType !== "all") where.procurementType = { contains: procurementType }
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
          initialProcurementType={procurementType}
        />
      </div>
    </div>
  )
}
