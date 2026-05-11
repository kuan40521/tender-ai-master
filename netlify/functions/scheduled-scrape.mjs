import { schedule } from "@netlify/functions"

// 每 10 分鐘 ping 一次 scrape endpoint。
// endpoint 內部會比對 DB 設定的 scrapeTimes（10 min window）決定是否真的執行。
export const handler = schedule("*/10 * * * *", async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ""

  if (!siteUrl) {
    console.error("[scheduled-scrape] 缺少 SITE_URL / URL 環境變數")
    return { statusCode: 500 }
  }
  if (!cronSecret) {
    console.error("[scheduled-scrape] 缺少 CRON_SECRET 環境變數")
    return { statusCode: 500 }
  }

  const url = `${siteUrl}/api/cron/scrape?cron_secret=${encodeURIComponent(cronSecret)}`
  const startedAt = Date.now()

  try {
    const res = await fetch(url)
    const elapsed = Date.now() - startedAt
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    if (!res.ok) {
      console.error(`[scheduled-scrape] HTTP ${res.status} (${elapsed}ms):`, data)
      return { statusCode: res.status }
    }

    console.log(`[scheduled-scrape] OK (${elapsed}ms):`, data.message || data)
    return { statusCode: 200 }
  } catch (e) {
    console.error(`[scheduled-scrape] fetch error (${Date.now() - startedAt}ms):`, e?.message || e)
    return { statusCode: 500 }
  }
})
