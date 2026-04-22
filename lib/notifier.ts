import nodemailer from "nodemailer"

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

console.log(`[SMTP Debug] Using Host: ${process.env.SMTP_HOST || "DEFAULT (Ethereal)"}, User: ${process.env.SMTP_USER || "DEFAULT"}`)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // 465 填 true, 587 填 false
  auth: {
    user: process.env.SMTP_USER || "test_user",
    pass: process.env.SMTP_PASS || "test_pass",
  },
  // 強制使用 IPv4 避免某些網路環境 IPv6 不通
  ...(process.env.SMTP_HOST?.includes("gmail") ? {
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  } : {})
})

/**
 * 寄發 Email 通知
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Tender AI System" <${process.env.SMTP_USER || "noreply@tender.ai"}>`,
      to,
      subject,
      html,
    })
    
    console.log("--------------------------------------------------")
    console.log(`[Email Sent] To: ${to}`)
    console.log(`[Email Sent] Subject: ${subject}`)
    
    // 當使用 Ethereal Email 進行本地測試時，或是未設定真實發信服務時
    if (process.env.SMTP_HOST === "smtp.ethereal.email" || !process.env.SMTP_HOST || process.env.SMTP_USER === "test_user") {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("⚠️ 目前處於測試發信模式，信件不會寄到真實信箱。")
        console.log("🔗 郵件預覽網址: %s", previewUrl)
        console.log("--------------------------------------------------")
    }
  } catch (error) {
    console.error("❌ Email 發送失敗:", error)
    console.log("📜 郵件 HTML 內容備份 (發送失敗時可用於檢查):")
    console.log(html)
  }
}

/**
 * 批次轉換標案物件為 HTML 並寄送
 */
export async function sendTenderAlert(tenders: any[], to: string) {
  if (!tenders || tenders.length === 0) return

  const subject = `[Tender AI] 發現 ${tenders.length} 筆高潛力標案！`
  
  let html = `<h2>今日為您篩選的潛力標案：</h2><ol>`
  tenders.forEach(t => {
    html += `
      <li style="margin-bottom: 20px;">
        <strong>${t.title}</strong><br/>
        招標機關：${t.agency}<br/>
        預算金額：${t.budget}<br/>
        公告日期：${t.releaseDate}<br/>
        <a href="${t.url}" style="display:inline-block; margin-top:8px; padding:6px 12px; background:#007bff; color:#fff; text-decoration:none; border-radius:4px;">查看標案詳情</a>
      </li>
    `
  })
  html += `</ol>`

  await sendEmail({ to, subject, html })
}
