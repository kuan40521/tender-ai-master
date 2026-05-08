import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/notifier"
import { buildReportHtml } from "@/lib/email-template"

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

    const tenders = (hotTenders as any[]).map((t) => ({
      confidence: t.confidence,
      title: t.title,
      agency: t.agency,
      budget: t.budget,
      dueDate: t.dueDate,
      url: t.url,
    }))

    const subject = `[Tender AI] 即時情報：${tenders.length} 筆信心度 ≥ ${minConfidence}% 的商機`
    const html = buildReportHtml({ tenders, threshold: minConfidence, isManual: true })

    for (const rec of recipients) {
      await sendEmail({ to: rec.email, subject, html })
    }

    return NextResponse.json({
      success: true,
      message: `成功發送至 ${recipients.length} 位收件人，共 ${tenders.length} 筆標案。`,
      tenderCount: tenders.length,
      recipientCount: recipients.length,
    })
  } catch (error: any) {
    console.error("send-report error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
