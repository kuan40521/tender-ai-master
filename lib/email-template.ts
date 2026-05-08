interface TenderItem {
  confidence: number
  title: string
  agency: string
  budget: string
  dueDate: string
  url: string
}

function confidencePill(score: number): string {
  const color = score >= 80 ? "#15803D" : score >= 70 ? "#B45309" : "#64748B"
  const bg    = score >= 80 ? "#ECFDF5" : score >= 70 ? "#FEF3C7" : "#F1F5F9"
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;">AI 信心度 ${score}%</span>`
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
      <td style="background:#FFFFFF;padding:24px 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
          <tr>
            <td style="font-size:11px;font-weight:600;color:#A0A8B8;letter-spacing:1px;text-transform:uppercase;">商機 #${i + 1}</td>
            <td align="right">${confidencePill(t.confidence)}</td>
          </tr>
        </table>
        <div style="font-size:16px;font-weight:800;color:#0F172A;line-height:1.5;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #EEE;">
          ${t.title}
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E2E8F0;border-radius:6px;overflow:hidden;margin-bottom:16px;">
          <tr>
            <td width="88" style="background:#2C3A5C;color:#FFFFFF;font-size:12px;font-weight:600;padding:10px 14px;letter-spacing:0.3px;">機　　關</td>
            <td style="background:#F8FAFC;color:#334155;font-size:13px;padding:10px 14px;">${t.agency}</td>
          </tr>
          <tr>
            <td style="background:#2C3A5C;color:#FFFFFF;font-size:12px;font-weight:600;padding:10px 14px;border-top:1px solid #3D4E6E;letter-spacing:0.3px;">採購預算</td>
            <td style="background:#FFFFFF;color:#0F172A;font-size:14px;font-weight:700;padding:10px 14px;border-top:1px solid #E2E8F0;">${t.budget}</td>
          </tr>
          <tr>
            <td style="background:#2C3A5C;color:#FFFFFF;font-size:12px;font-weight:600;padding:10px 14px;border-top:1px solid #3D4E6E;letter-spacing:0.3px;">截止日期</td>
            <td style="background:#F8FAFC;color:#334155;font-size:13px;padding:10px 14px;border-top:1px solid #E2E8F0;">${t.dueDate}</td>
          </tr>
        </table>
        <div style="padding-bottom:${i === tenders.length - 1 ? "28" : "24"}px;${i < tenders.length - 1 ? "border-bottom:2px solid #F1F5F9;" : ""}">
          <a href="${t.url}" style="display:inline-block;background:#2C3A5C;color:#FFFFFF;font-size:13px;font-weight:600;padding:9px 20px;border-radius:5px;text-decoration:none;">查看原文公告 →</a>
        </div>
      </td>
    </tr>
  `).join("")

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ECEAE6;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECEAE6;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- MARBLE BANNER -->
        <tr>
          <td align="center" style="border-radius:10px 10px 0 0;padding:36px 32px 30px;background:linear-gradient(110deg, transparent 38%, rgba(170,148,120,0.07) 38%, rgba(170,148,120,0.07) 41%, transparent 41%),linear-gradient(260deg, transparent 52%, rgba(150,130,108,0.05) 52%, rgba(150,130,108,0.05) 56%, transparent 56%),linear-gradient(170deg, #FDFCFB 0%, #F5EDE3 30%, #EDE3D8 52%, #F2E8DF 72%, #FDFCFB 100%);">
            <div style="font-size:10px;font-weight:700;color:#A08860;letter-spacing:4px;text-transform:uppercase;margin-bottom:14px;">&#10022; &nbsp;TENDER AI&nbsp; &#10022;</div>
            <div style="width:56px;height:1px;background:linear-gradient(90deg,transparent,#C9A96E,transparent);margin:0 auto 18px;"></div>
            <div style="font-size:26px;font-weight:800;color:#1C1A17;letter-spacing:-0.3px;line-height:1.3;margin-bottom:10px;">政府採購情報 ${typeLabel}</div>
            <div style="font-size:12px;color:#A08860;letter-spacing:0.5px;margin-bottom:18px;">${dateLabel}&ensp;&middot;&ensp;發現 ${tenders.length} 筆高價值商機</div>
            <div style="width:56px;height:1px;background:linear-gradient(90deg,transparent,#C9A96E,transparent);margin:0 auto;"></div>
          </td>
        </tr>

        <!-- THRESHOLD BAR -->
        <tr>
          <td style="background:#2C3A5C;padding:10px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size:12px;color:#A8B8D8;">本次篩選條件</td>
                <td align="right" style="font-size:12px;color:#FFFFFF;font-weight:700;">AI 信心度 ≥ ${threshold}%</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TENDER LIST -->
        ${rows}

        <!-- FOOTER -->
        <tr>
          <td align="center" style="border-radius:0 0 10px 10px;padding:20px 32px;background:linear-gradient(110deg, transparent 38%, rgba(170,148,120,0.06) 38%, rgba(170,148,120,0.06) 41%, transparent 41%),linear-gradient(170deg, #F5EDE3 0%, #EDE3D8 50%, #F5EDE3 100%);">
            <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,#C9A96E,transparent);margin:0 auto 12px;"></div>
            <div style="font-size:10px;font-weight:700;color:#A08860;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;">TENDER AI</div>
            <div style="font-size:11px;color:#B0A090;line-height:1.7;">此郵件由系統自動發送。如需調整通知設定，請登入管理介面。${isManual ? "　本報告為手動觸發，非排程發送。" : ""}</div>
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
