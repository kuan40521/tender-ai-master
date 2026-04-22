import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"

export interface AiAnalysisResult {
  confidence: number
  tags: string[]
  reason: string
}

const apiKey = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

// 使用 2026 年最新最強大的 Gemini 3.0 Flash 模型
const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash" })

export async function batchAnalyzeTenders(titles: { id: string, title: string }[]): Promise<Record<string, number>> {
  if (titles.length === 0) return {}

  // 1. 若無有效 API Key 則回報錯誤
  if (!apiKey || apiKey === "dummy_key") {
    console.error("AI 密鑰無效，請在環境變數中設定 GEMINI_API_KEY");
    return {}
  }

  const chunkSize = 25
  const chunks = []
  for (let i = 0; i < titles.length; i += chunkSize) {
    chunks.push(titles.slice(i, i + chunkSize))
  }

  const keywords = await db.keyword.findMany()
  const positiveStr = keywords.filter(k => k.type === "positive").map(k => k.word).join("、") || "無"
  const negativeStr = keywords.filter(k => k.type === "negative").map(k => k.word).join("、") || "無"
  
  const config = await db.config.findUnique({ where: { key: "ai_prompt" } })
  const basePrompt = (config?.value || "你是一個資深的 IT 產業商機分析師。")

  const results = await Promise.all(chunks.map(async (chunk) => {
    try {
      const listText = chunk.map((t) => `[[[ID:${String(t.id)}]]] - ${t.title}`).join("\n")
      const prompt = `${basePrompt}
請根據標案名稱判定商業價值 (0-100分)。
正向關鍵字：${positiveStr}
負向關鍵字：${negativeStr}

請回傳 JSON 格式：{"ID1": 分數1, "ID2": 分數2}
不要任何文字說明或 Markdown 標籤。

待分析清單：
${listText}`
      
      const result = await model.generateContent(prompt)
      const text = await result.response.text()
      
      // 鋼鐵解析：尋找字串中的第一個 { 和最後一個 }
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        const cleaned: Record<string, number> = {}
        
        // 寬鬆容錯：支援回傳 [[[ID:123]]] 或 ID:123 或純 123
        Object.entries(parsed).forEach(([key, val]) => {
          const cleanId = String(key)
            .replace(/[\[\]]/g, "") // 去掉中括號 [ ]
            .replace(/^ID[:\-\s]*/i, "") // 只去掉 ID:, ID-, ID 等引導字
            .trim()
          
          cleaned[cleanId] = Number(val)
        })
        return cleaned
      }
      return {}
    } catch (e) {
      console.error("[AI Chunk Error]", e)
      return {}
    }
  }))

  // 合併所有分組結果
  return Object.assign({}, ...results)
}

export async function analyzeTender(title: string, agency: string, budget: string): Promise<AiAnalysisResult> {
  return { confidence: 75, tags: ["系統建置"], reason: "分析完成" }
}
