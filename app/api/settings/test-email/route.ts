import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/notifier"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "未提供收件人 Email" }, { status: 400 })
    }

    const now = new Date()
    const twTime = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
    const testSubject = `[Tender AI] 系統測試郵件 - ${twTime}`
    const testHtml = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #007bff;">🔔 測試成功！</h2>
        <p>您好 ${name || "使用者"}，</p>
        <p>這是一封來自 <strong>政府採購情報 AI 分析系統</strong> 的測試郵件。</p>
        <p>當您看到這封信，表示系統的 SMTP 通知設定運作正常。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">執行時間 (台灣)：${twTime}</p>
      </div>
    `

    await sendEmail({
      to: email,
      subject: testSubject,
      html: testHtml
    })

    return NextResponse.json({ success: true, message: "測試郵件已發送，請檢查收件匣" })
  } catch (error: any) {
    console.error("Test email failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
