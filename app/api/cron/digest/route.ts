import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/notifier"
import { getTWDate, getTimeStr } from "@/lib/date"

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
    
    const subject = `[Tender AI] 每日情報匯總：今日發現 ${tenderCount} 筆高價值商機！`
    
    let html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">政府採購情報 AI 每日匯總</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">篩選條件：信心度 $\ge$ ${threshold}%</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0;">您好，以下是系統為您篩選出品項：</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    `

    hotTenders.forEach(t => {
      html += `
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed #e2e8f0;">
          <div style="display: inline-block; padding: 4px 8px; background: #f0f9ff; color: #0369a1; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px;">
             AI 信心度 ${t.confidence}%
          </div>
          <h3 style="margin: 0 0 8px 0; color: #0f172a; line-height: 1.4;">${t.title}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>機關：</strong>${t.agency}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>預算：</strong>${t.budget}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>截止日期：</strong>${t.dueDate}</p>
          <a href="${t.url}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">前往 PCC 原文</a>
        </div>
      `
    })

    html += `
          <div style="padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">此為系統自動發送之情報。您可以隨時登入系統調整關鍵字策略或通知規則。</p>
          </div>
        </div>
      </div>
    `

    // 6. 發送郵件
    for (const rec of recipients) {
      await sendEmail({
        to: rec.email,
        subject,
        html
      })
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
