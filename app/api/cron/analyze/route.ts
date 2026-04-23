import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { batchAnalyzeTenders } from "@/lib/ai"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 對標案觸發 AI 分析
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"
    const cronSecret = searchParams.get('cron_secret')
    const isManual = searchParams.get('manual') === 'true'

    // 驗證安全性
    if (process.env.NODE_ENV === 'production') {
      if (!isManual && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 找出標案：如果是 force，就抓前 100 筆；如果不是，只抓尚未分析的
    const unanalyzed = await db.tender.findMany({
      where: force ? {} : {
        OR: [
          { confidence: 0 },
          { reason: { contains: "分析中" } }
        ]
      },
      take: 25,
      orderBy: { createdAt: 'desc' }
    })

    if (unanalyzed.length === 0) {
      // 所有標案都已分析，顯示目前分布
      const all = await db.tender.findMany({ select: { id: true, title: true, confidence: true } })
      return NextResponse.json({
        success: true,
        message: "所有標案已完成 AI 分析",
        totalTenders: all.length,
        sample: all.slice(0, 5)
      })
    }

    // 取得 threshold 設定
    const configs = await db.config.findMany()
    const threshold = Number(configs.find(c => c.key === "threshold")?.value || "80")

    // 執行批量 AI 分析
    const titles = unanalyzed.map(t => ({ id: String(t.id), title: t.title }))
    const scores = await batchAnalyzeTenders(titles)

    // 使用 Promise.all 同步更新資料庫，大幅提升速度
    await Promise.all(unanalyzed.map(async (tender) => {
      const confidence = scores[String(tender.id)]
      
      // 只有在 AI 確實有給出分數時才更新
      if (confidence !== undefined && confidence !== null) {
        return db.tender.update({
          where: { id: tender.id },
          data: {
            confidence,
            reason: confidence >= threshold ? `高潛力 IT 商機 (>=${threshold}%)` : "潛力一般",
            tags: confidence >= 80 ? JSON.stringify(["系統建置", "IT商機"]) : "[]"
          }
        })
      } else {
        // AI 沒給出分數，標記為失敗以便下次重試，而不是給 50 分誤導
        return db.tender.update({
          where: { id: tender.id },
          data: {
            confidence: 0,
            reason: "AI 分析失敗：匹配失敗或模型未回傳"
          }
        })
      }
    }))

    return NextResponse.json({
      success: true,
      message: `AI 分析完成：共更新 ${unanalyzed.length} 筆標案`,
      updatedCount: unanalyzed.length,
    })
  } catch (error: any) {
    console.error("Re-analyze error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
