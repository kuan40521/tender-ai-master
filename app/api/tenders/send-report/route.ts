import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/notifier"

export async function POST(request: Request) {
  try {
    const { threshold = 70 } = await request.json()
    const minConfidence = Math.max(0, Math.min(100, Number(threshold)))

    const [hotTenders, recipients] = await Promise.all([
      db.tender.findMany({
        where: { confidence: { gte: minConfidence } },
        orderBy: { confidence: "desc" },
      }),
      db.recipient.findMany({ where: { isEnabled: true } }),
    ])

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, message: "無任何啟用的收件人，請先至「系統設定與通知」新增收件人。" })
    }

    if (hotTenders.length === 0) {
      return NextResponse.json({ success: false, message: `無信心度 ≥ ${minConfidence}% 的標案。` })
    }

    const subject = `[Tender AI] 即時情報：${hotTenders.length} 筆信心度 ≥ ${minConfidence}% 的商機`

    let html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">政府採購情報 AI 即時報告</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">篩選條件：信心度 ≥ ${minConfidence}%，共 ${hotTenders.length} 筆</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0;">以下為系統篩選出的高潛力標案：</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    `

    for (const t of hotTenders) {
      const td = t as any
      html += `
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed #e2e8f0;">
          <div style="display: inline-block; padding: 4px 8px; background: #f0f9ff; color: #0369a1; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px;">
            AI 信心度 ${td.confidence}%
          </div>
          <h3 style="margin: 0 0 8px 0; color: #0f172a; line-height: 1.4;">${td.title}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>機關：</strong>${td.agency}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>預算：</strong>${td.budget}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>截止日期：</strong>${td.dueDate}</p>
          <a href="${td.url}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">前往 PCC 原文</a>
        </div>
      `
    }

    html += `
          <div style="padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">此為手動觸發之即時情報，非排程自動發送。</p>
          </div>
        </div>
      </div>
    `

    for (const rec of recipients) {
      await sendEmail({ to: rec.email, subject, html })
    }

    return NextResponse.json({
      success: true,
      message: `成功發送至 ${recipients.length} 位收件人，共 ${hotTenders.length} 筆標案。`,
      tenderCount: hotTenders.length,
      recipientCount: recipients.length,
    })
  } catch (error: any) {
    console.error("send-report error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
