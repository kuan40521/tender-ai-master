interface TenderItem {
  confidence: number
  title: string
  agency: string
  budget: string
  dueDate: string
  url: string
}

function confidencePill(score: number): string {
  const color = score >= 80 ? "#16A34A" : score >= 70 ? "#D97706" : "#94A3B8"
  const bg   = score >= 80 ? "#F0FDF4" : score >= 70 ? "#FFFBEB" : "#F8FAFC"
  return `<span style="display:inline-block;padding:2px 8px;background:${bg};color:${color};border:1px solid ${color}33;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:0.3px;">${score}%</span>`
}

export function buildReportHtml({
  tenders,
  threshold,
  isManual = false,
  date = "",
}: {
  tenders: TenderItem[]
  threshold: number
  isManual?: boolean
  date?: string
}): string {
  const dateLabel = date || new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })
  const typeLabel = isManual ? "即時情報" : "每日匯總"

  const rows = tenders.map((t, i) => `
    <tr>
      <td style="padding:18px 0;border-bottom:1px solid #E2E8F0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:6px;">
              ${confidencePill(t.confidence)}
              <span style="margin-left:8px;font-size:12px;color:#94A3B8;font-weight:500;">#${i + 1}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:8px;">
              <span style="font-size:15px;font-weight:700;color:#0F172A;line-height:1.5;">${t.title}</span>
            </td>
          </tr>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:24px;padding-bottom:4px;">
                    <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:1px;">機關</span>
                    <span style="font-size:13px;color:#475569;">${t.agency}</span>
                  </td>
                  <td style="padding-right:24px;padding-bottom:4px;">
                    <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:1px;">預算</span>
                    <span style="font-size:13px;color:#0F172A;font-weight:600;">${t.budget}</span>
                  </td>
                  <td style="padding-bottom:4px;">
                    <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:1px;">截止日期</span>
                    <span style="font-size:13px;color:#475569;">${t.dueDate}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:10px;">
              <a href="${t.url}" style="font-size:13px;color:#2563EB;text-decoration:none;font-weight:500;">查看原文公告 →</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("")

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#FFFFFF;border-radius:8px 8px 0 0;border-top:3px solid #2563EB;padding:24px 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:600;color:#2563EB;letter-spacing:1px;text-transform:uppercase;">Tender AI</span>
                    <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0F172A;">政府採購情報 ${typeLabel}</h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="font-size:12px;color:#94A3B8;">${dateLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Bar -->
          <tr>
            <td style="background:#F8FAFC;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;padding:12px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:13px;color:#475569;">本次篩選條件：</span>
                    <span style="font-size:13px;color:#0F172A;font-weight:600;">AI 信心度 ≥ ${threshold}%</span>
                  </td>
                  <td align="right">
                    <span style="font-size:13px;color:#0F172A;font-weight:700;">${tenders.length} 筆</span>
                    <span style="font-size:13px;color:#475569;"> 符合商機</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tender List -->
          <tr>
            <td style="background:#FFFFFF;border:1px solid #E2E8F0;padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FFFFFF;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 8px 8px;padding:20px 32px 24px;">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                此郵件由 <strong style="color:#64748B;">Tender AI 系統</strong>自動發送。如需調整關鍵字策略或通知設定，請登入系統管理介面。
                ${isManual ? "本報告為手動觸發，非每日排程發送。" : ""}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
