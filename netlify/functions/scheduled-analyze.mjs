import { schedule } from "@netlify/functions"

// 每 5 分鐘檢查待分析佇列。scrape 只負責存資料，AI 分析由本排程逐批處理，
// 避免單次 cron 撞 Netlify Function 10s/26s timeout。
export const handler = schedule("*/5 * * * *", async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ""

  if (!siteUrl || !cronSecret) {
    console.error("[scheduled-analyze] 缺少 SITE_URL / CRON_SECRET")
    return { statusCode: 500 }
  }

  // force=true 讓 analyze 不限定當日，把累積的 confidence=0 通通處理掉
  const url = `${siteUrl}/api/cron/analyze?cron_secret=${encodeURIComponent(cronSecret)}&force=true`
  const startedAt = Date.now()

  try {
    const res = await fetch(url)
    const elapsed = Date.now() - startedAt
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    if (!res.ok) {
      console.error(`[scheduled-analyze] HTTP ${res.status} (${elapsed}ms):`, data)
      return { statusCode: res.status }
    }

    console.log(`[scheduled-analyze] OK (${elapsed}ms):`, data.message || data)
    return { statusCode: 200 }
  } catch (e) {
    console.error(`[scheduled-analyze] fetch error (${Date.now() - startedAt}ms):`, e?.message || e)
    return { statusCode: 500 }
  }
})
