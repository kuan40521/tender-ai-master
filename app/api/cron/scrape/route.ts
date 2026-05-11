import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scrapeTodayTenders, filterTenders } from "@/lib/scraper"
import { sendTenderAlert } from "@/lib/notifier"
import { batchAnalyzeTenders } from "@/lib/ai"
import { getTWDate, getMinguoDate, getTimeStr } from "@/lib/date"

// 為避免排程 timeout，可設定大一點的時間
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cronSecret = searchParams.get('cron_secret')
  const isForce = searchParams.get('force') === 'true'
  const isManual = searchParams.get('manual') === 'true'
  const targetDate = searchParams.get('date') // 接收前端傳來的民國日期 (例如 113/04/22)

  // 驗證安全性
  const isProd = process.env.NODE_ENV === 'production'
  
  if (isProd) {
    // 只有在 (1) 是手動觸發 或 (2) 提供正確 Cron Secret 時才允許執行
    if (!isManual && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // 2. 取得時間設定與目前時間
    const configs = await db.config.findMany()
    const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]))
    const scrapeTimes = JSON.parse(configMap.scrapeTimes || '["09:00"]')
    
    const now = getTWDate()
    const currentTimeStr = getTimeStr(now)

    // 如果不是手動強制執行，也不是排程時間，就跳過 (容許 10 分鐘內的誤差)
    const isScheduledTime = scrapeTimes.some((t: string) => {
      const [h, m] = t.split(':').map(Number)
      const [nowH, nowM] = currentTimeStr.split(':').map(Number)
      const scheduledMinutes = h * 60 + m
      const currentMinutes = nowH * 60 + nowM
      return currentMinutes >= scheduledMinutes && currentMinutes < scheduledMinutes + 10
    })

    if (!isScheduledTime && !isForce) {
      return NextResponse.json({ success: true, message: "非排程執行時間點" })
    }

    // 3. 取得目前系統內的關鍵字
    const keywords = await db.keyword.findMany()
    const positiveKeywords = keywords.filter(k => k.type === "positive").map(k => k.word)
    const negativeKeywords = keywords.filter(k => k.type === "negative").map(k => k.word)

    if (positiveKeywords.length === 0) positiveKeywords.push("系統", "平台", "外包", "AI", "應用程式", "軟體")
    if (negativeKeywords.length === 0) negativeKeywords.push("維修", "冷氣", "保全", "清潔", "硬體")

    // 4. 執行抓取與過濾
    // 邏輯：如果是手動強制執行 (isForce)，則允許使用指定日期 (targetDate)
    // 如果是自動觸發，則不帶入日期參數，由 Scraper 預設抓取今天
    const { tenders: scrapedList, rawHtml } = await scrapeTodayTenders(
      positiveKeywords, 
      isForce && targetDate ? targetDate : undefined
    )
    // 只保留勞務類標案
    const filteredList = filterTenders(scrapedList, positiveKeywords, negativeKeywords)
      .filter(t => t.procurementType.includes("勞務"))

    const newlyAdded = []

    // 4. 快速存入資料庫 (略過 AI)
    for (const tender of filteredList) {
      const exists = await db.tender.findFirst({
        where: {
          agency: tender.agency,
          title: tender.title,
          releaseDate: tender.releaseDate
        }
      })

      if (!exists) {
        const saved = await db.tender.create({
          data: {
            agency: tender.agency,
            title: tender.title,
            budget: tender.budget,
            releaseDate: tender.releaseDate,
            dueDate: tender.dueDate,
            url: tender.url,
            biddingType: tender.biddingType,
            procurementType: tender.procurementType,
            confidence: 0,
            tags: "[]",
            reason: "AI 分析中...",
          }
        })
        newlyAdded.push(saved)
      }
    }

    // 5. 等待 AI 分析完成：重新分析當日所有標案（含既有 + 新增）
    const dateForAnalysis = targetDate || getMinguoDate(getTWDate())
    const tendersToAnalyze = await db.tender.findMany({
      where: { releaseDate: dateForAnalysis },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    if (tendersToAnalyze.length > 0) {
      await runBackgroundTasks(tendersToAnalyze)
    }

    // 6. 紀錄執行狀態
    const twNow = getTWDate()
    const logDate = getMinguoDate(twNow)
    const logTime = getTimeStr(twNow)

    await db.crawlerLog.create({
      data: {
        date: targetDate || logDate,
        time: logTime,
        status: "success",
        fetchedCount: scrapedList.length,
        filteredCount: filteredList.length,
        message: newlyAdded.length > 0 ? `新增 ${newlyAdded.length} 筆` : "無新增",
      }
    })

    return NextResponse.json({
      success: true,
      scrapedCount: scrapedList.length,
      filteredCount: filteredList.length,
      addedCount: newlyAdded.length,
      message: newlyAdded.length > 0 
        ? `成功新增 ${newlyAdded.length} 筆標案，AI 正在背景分析中` 
        : `無新增標案或不符過濾條件 (爬取總數: ${scrapedList.length}, 關鍵字篩選後: ${filteredList.length})`,
      // Debug 用：顯示前 5 筆已解析的標案名稱，確認爬蟲正確
      debugScrapedList: scrapedList.slice(0, 5).map(t => ({ title: t.title, agency: t.agency })),
      debugFilteredList: filteredList.slice(0, 5).map(t => ({ title: t.title, agency: t.agency })),
    })

  } catch (error: any) {
    console.error("Cron scrape error:", error)
    
    // 紀錄失敗日誌
    try {
      await db.crawlerLog.create({
        data: {
          date: "N/A",
          time: new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          status: "failed",
          message: error.message.substring(0, 100),
        }
      })
    } catch (logErr) {}

    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

async function runBackgroundTasks(newTenders: any[]) {
  const configs = await db.config.findMany()
  const threshold = Number(configs.find(c => c.key === "threshold")?.value || "80")

  try {
    const titles = newTenders.map(t => ({ id: t.id, title: t.title }))
    const scores = await batchAnalyzeTenders(titles)

    // 平行更新資料庫，與 analyze 路由相同做法
    await Promise.all(newTenders.map(async (tender) => {
      const confidence = scores[tender.id]
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
          data: { confidence: 0, reason: "AI 分析失敗：匹配失敗或模型未回傳" }
        })
      }
    }))
  } catch (e) {
    console.error("Batch AI Analysis failed:", e)
  }
}
