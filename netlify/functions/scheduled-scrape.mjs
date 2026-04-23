import { schedule } from "@netlify/functions"

export const handler = schedule("*/10 * * * *", async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ''

  try {
    const res = await fetch(`${siteUrl}/api/cron/scrape?cron_secret=${cronSecret}`)
    const data = await res.json()
    console.log('[scheduled-scrape]', data.message || data)
  } catch (e) {
    console.error('[scheduled-scrape] error:', e)
  }

  return { statusCode: 200 }
})
