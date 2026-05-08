export const dynamic = 'force-dynamic'

import { Info } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { KeywordManager } from "@/components/keywords/keyword-manager"
import { AiPromptEditor } from "@/components/keywords/ai-prompt-editor"
import { db } from "@/lib/db"

const DEFAULT_PROMPT = `你是一個專業的資通訊產業分析師。我們是一家「客製化軟體開發與系統整合公司」。

請根據標案名稱判定其對「軟體開發商」的商業價值 (0-100分)：

1. 【極高分 85-100】：涉及 AI 演算法、情資分析、資安防護、客製軟體開發、大數據平台。
2. 【中高分 60-84】：單純的系統整合案、APP 開發、雲端遷移。
3. 【低分 0-59】：
   - 排除硬體：攝像(CCTV)、錄影、監控、變頻器、馬達、電力設備、消防空調安裝。
   - 排除勞務：3D 掃描、數位化保存、考古、修護、教材推廣、農業調查、支援、勞務。
   - 排除土木：水利、清淤、道路、建築。

評分要求：請根據相關程度給出精確分數（如 73, 42, 15），嚴禁全部給予相同的整數分數（如 80 或 20）。`

export default async function KeywordsPage() {
  let keywords = []
  let aiPrompt = DEFAULT_PROMPT
  
  try {
    keywords = await db.keyword.findMany({
      orderBy: { createdAt: "asc" }
    })
    
    const config = await db.config.findUnique({ where: { key: "ai_prompt" } })
    if (config) {
      aiPrompt = config.value
    }
  } catch (error) {
    console.error("Database connection failed, using empty data:", error)
    keywords = []
  }

  // 將資料庫模型轉換為前端使用的格式
  const positiveKeywords = keywords.filter(k => k.type === "positive").map(k => k.word)
  const negativeKeywords = keywords.filter(k => k.type === "negative").map(k => k.word)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="關鍵字策略管理"
        description="動態調整 AI 分析與爬蟲抓取的基準。正向關鍵字用於擴大搜尋範圍，負向關鍵字用於降低雜訊與 AI 運算成本。"
      />

      <div className="flex flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <Alert className="border-primary/20 bg-primary/5 text-foreground">
          <Info className="size-4 text-primary" />
          <AlertTitle>策略變更將於下次爬蟲或重新分析時生效</AlertTitle>
          <AlertDescription>
            若需立即套用，請至標案列表點擊「🤖 AI 重新分析」。
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <KeywordManager
            title="正向關鍵字"
            description="爬蟲會依此清單於 PCC 網站檢索，至少需包含一個才會被抓取。同時 AI 也會強制給予高分。"
            variant="positive"
            initial={positiveKeywords}
            suggestions={["雲端", "資訊安全", "區塊鏈", "物聯網", "LLM", "客製化軟體"]}
          />
          <KeywordManager
            title="負向關鍵字"
            description="用於第一層快速剔除不相關案件，AI 遇到這些字也會強制給予低分雜訊評價。"
            variant="negative"
            initial={negativeKeywords}
            suggestions={["耗材", "運動器材", "車輛", "桌椅", "門禁", "排水"]}
          />
        </div>

        <AiPromptEditor initialPrompt={aiPrompt} />
      </div>
    </div>
  )
}
