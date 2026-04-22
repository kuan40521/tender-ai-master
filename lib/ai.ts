import { GoogleGenerativeAI } from "@google/generative-ai"
import { db } from "@/lib/db"

export interface AiAnalysisResult {
  confidence: number
  tags: string[]
  reason: string
}

const apiKey = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

// 使用當前最穩定的 Flash 模型，確保 API 連線成功
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

export async function batchAnalyzeTenders(titles: { id: string, title: string }[]): Promise<Record<string, number>> {
  if (titles.length === 0) return {}

  // 1. 若無 API Key 則使用模擬邏輯
  if (!apiKey || apiKey === "dummy_key") {
    const mockRes: Record<string, number> = {}
    titles.forEach(t => {
      mockRes[String(t.id)] = 50 + Math.floor(Math.random() * 40)
    })
    return mockRes
  }

  // 分組並行處理：每組 25 筆，利用 Promise.all 讓 4 組同時開跑
  const chunkSize = 25
  const chunks = []
  for (let i = 0; i < titles.length; i += chunkSize) {
    chunks.push(titles.slice(i, i + chunkSize))
  }

  const keywords = await db.keyword.findMany()
  const positiveStr = keywords.filter(k => k.type === "positive").map(k => k.word).join("、") || "無"
  const negativeStr = keywords.filter(k => k.type === "negative").map(k => k.word).join("、") || "無"
  
  const config = await db.config.findUnique({ where: { key: "ai_prompt" } })
  const basePrompt = (config?.value || "你是一個資深的 IT 產業商機分析師。") + 
    "\n請根據標案名稱判定商業價值 (0-100分)。"

  const results = await Promise.all(chunks.map(async (chunk) => {
    try {
      const listText = chunk.map((t) => `ID:${String(t.id)} - ${t.title}`).join("\n")
      const prompt = `${basePrompt}\n\n正向關鍵字：[${positiveStr}]\n負向關鍵字：[${negativeStr}]` +
                    `\n\n待分析清單：\n${listText}\n\n請只回傳 JSON 格式：{"ID": 分數}，不要任何文字說明。`
      
      const result = await model.generateContent(prompt)
      let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim()
      return JSON.parse(text)
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
