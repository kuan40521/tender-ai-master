import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { batchAnalyzeTenders } from "@/lib/ai"
import { getMinguoDate, getTWDate } from "@/lib/date"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"
    const cronSecret = searchParams.get('cron_secret')
    const isManual = searchParams.get('manual') === 'true'
    // date 參數：指定分析哪一天（民國日期格式 113/04/22），預設為今天
    const dateParam = searchParams.get('date')

    // 驗證安全性
    if (process.env.NODE_ENV === 'production') {
      if (!isManual && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 預設只分析今天的標案，避免浪費 API 費用
    const todayDate = getMinguoDate(getTWDate())
    const targetDate = dateParam || todayDate

    // 找出標案：
    // - force=true：分析所有未分析的（不限日期）
    // - 預設：只分析當日（或指定日期）且尚未分析的
    const unanalyzed = await db.tender.findMany({
      where: force ? {
        OR: [
          { confidence: 0 },
          { reason: { contains: "分析中" } }
        ]
      } : {
        releaseDate: targetDate,
        OR: [
          { confidence: 0 },
          { reason: { contains: "分析中" } }
        ]
      },
      // 限制單次批量，避免 Netlify Function timeout（10s Free / 26s Pro）。
      // 排程每 5 min 跑一次，會逐批消化 backlog。
      take: 25,
      orderBy: { createdAt: 'desc' }
    })

    if (unanalyzed.length === 0) {
      return NextResponse.json({
        success: true,
        message: force
          ? "所有標案已完成 AI 分析"
          : `${targetDate} 的標案已全數分析完畢`
      })
    }

    // 取得 threshold 設定
    const configs = await db.config.findMany()
    const threshold = Number(configs.find(c => c.key === "threshold")?.value || "80")

    // 執行批量 AI 分析（平行處理，速度快）
    const titles = unanalyzed.map(t => ({ id: String(t.id), title: t.title }))
    const scores = await batchAnalyzeTenders(titles)

    await Promise.all(unanalyzed.map(async (tender) => {
      const confidence = scores[String(tender.id)]

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
      message: `AI 分析完成（${targetDate}）：共更新 ${unanalyzed.length} 筆標案`,
      updatedCount: unanalyzed.length,
      targetDate,
    })
  } catch (error: any) {
    console.error("Re-analyze error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
