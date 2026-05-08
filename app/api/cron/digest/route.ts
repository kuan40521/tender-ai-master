import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/notifier"
import { getTWDate, getTimeStr } from "@/lib/date"
import { buildReportHtml } from "@/lib/email-template"

export const maxDuration = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cronSecret = searchParams.get('cron_secret')
  const isForce = searchParams.get('force') === 'true'

  // 1. 安全驗證
  if (process.env.NODE_ENV === 'production' && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. 取得設定
    const configs = await db.config.findMany()
    const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]))
    
    // 檢查是否為排程時間
    const dailyTimes = JSON.parse(configMap.dailyTimes || '["17:30"]')
    
    const now = getTWDate()
    const currentTimeStr = getTimeStr(now)

    const isScheduledTime = dailyTimes.some((t: string) => {
      const [h, m] = t.split(':').map(Number)
      const [nowH, nowM] = currentTimeStr.split(':').map(Number)
      const scheduledMinutes = h * 60 + m
      const currentMinutes = nowH * 60 + nowM
      return currentMinutes >= scheduledMinutes && currentMinutes < scheduledMinutes + 10
    })

    if (!isScheduledTime && !isForce) {
      return NextResponse.json({ success: true, message: "非每日報告發送時間點" })
    }

    const isEnabled = configMap.dailyDigest === "true"
    const threshold = Number(configMap.threshold || "80")

    if (!isEnabled && !isForce) {
      return NextResponse.json({ success: false, message: "每日匯總通知目前已關閉" })
    }

    // 2. 取得今日午夜時間 (台灣)
    const startOfToday = getTWDate()
    startOfToday.setHours(0, 0, 0, 0)

    // 3. 查詢符合條件的標案 (今日新增且信心度高於閾值)
    const hotTenders = await db.tender.findMany({
      where: {
        createdAt: { gte: startOfToday },
        confidence: { gte: threshold }
      },
      orderBy: { confidence: "desc" }
    })

    if (hotTenders.length === 0) {
      return NextResponse.json({ success: true, message: "今日無符合閾值的高價值標案，不發送通知" })
    }

    // 4. 取得啟用中的收件人
    const recipients = await db.recipient.findMany({
      where: { isEnabled: true }
    })

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, message: "無任何啟用的收件人，無法發送報表" })
    }

    // 5. 彙整郵件內容
    const emailsCount = recipients.length
    const tenderCount = hotTenders.length

    const subject = `[Tender AI] 每日情報匯總：今日發現 ${tenderCount} 筆高價值商機`

    const tenders = (hotTenders as any[]).map((t) => ({
      confidence: t.confidence,
      title: t.title,
      agency: t.agency,
      budget: t.budget,
      dueDate: t.dueDate,
      url: t.url,
    }))

    const html = buildReportHtml({ tenders, threshold, isManual: false })

    // 6. 發送郵件
    for (const rec of recipients) {
      await sendEmail({ to: rec.email, subject, html })
    }

    return NextResponse.json({
      success: true,
      message: `成功發送每日報告至 ${emailsCount} 位收件人，共包含 ${tenderCount} 筆標案。`
    })

  } catch (error: any) {
    console.error("Digest cron error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
