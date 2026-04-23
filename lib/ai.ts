import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"

export interface AiAnalysisResult {
  confidence: number
  tags: string[]
  reason: string
}

const apiKey = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" })

export async function batchAnalyzeTenders(titles: { id: string, title: string }[]): Promise<Record<string, number>> {
  if (titles.length === 0) return {}

  if (!apiKey || apiKey === "dummy_key") {
    console.error("AI 密鑰無效，請設定 GEMINI_API_KEY");
    return {}
  }

  // 1. 建立「索引 -> UUID」的對照表
  const idMap: Record<string, string> = {}
  const titlesForAi = titles.map((t, index) => {
    const aiId = String(index + 1)
    idMap[aiId] = t.id
    return { aiId, title: t.title }
  })

  // 2. 分組處理
  const chunkSize = 25
  const results: Record<string, number> = {}
  
  const keywords = await db.keyword.findMany()
  const positiveStr = keywords.filter(k => k.type === "positive").map(k => k.word).join("、") || "無"
  const negativeStr = keywords.filter(k => k.type === "negative").map(k => k.word).join("、") || "無"
  const config = await db.config.findUnique({ where: { key: "ai_prompt" } })
  const basePrompt = (config?.value || "你是一個資深的 IT 產業商機分析師。")

  // 切成多個 chunk，全部平行送出，速度比循序快 N 倍
  const chunks: typeof titlesForAi[] = []
  for (let i = 0; i < titlesForAi.length; i += chunkSize) {
    chunks.push(titlesForAi.slice(i, i + chunkSize))
  }

  const chunkResults = await Promise.all(chunks.map(async (chunk) => {
    const partial: Record<string, number> = {}
    try {
      const listText = chunk.map((t) => `序號:${t.aiId} - ${t.title}`).join("\n")
      const prompt = `${basePrompt}

### 核心評分準則 (請嚴格遵守)：
1. **正向權重**：若標案名稱包含 [${positiveStr}]，請大幅提高分數。
2. **負向排除**：若標案名稱包含 [${negativeStr}]，分數不應超過 20 分。

請根據標案名稱判定商業價值 (0-100分)。
請回傳 JSON 格式：{"序號": 分數}
範例：{"1": 85, "2": 15}
絕對不要包含任何文字說明。

待分析清單：
${listText}`

      const result = await model.generateContent(prompt)
      const text = await result.response.text()
      const match = text.match(/\{[\s\S]*\}/)

      if (match) {
        const parsed = JSON.parse(match[0])
        Object.entries(parsed).forEach(([aiId, score]) => {
          const originalUuid = idMap[String(aiId).trim()]
          if (originalUuid) {
            partial[originalUuid] = Number(score)
          }
        })
      }
    } catch (e) {
      console.error("[AI Batch Error]", e)
    }
    return partial
  }))

  // 合併所有 chunk 結果
  for (const partial of chunkResults) {
    Object.assign(results, partial)
  }

  return results
}

export async function analyzeTender(title: string, agency: string, budget: string): Promise<AiAnalysisResult> {
  return { confidence: 75, tags: ["系統建置"], reason: "分析完成" }
}
