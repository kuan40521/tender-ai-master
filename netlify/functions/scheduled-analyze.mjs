import { schedule } from "@netlify/functions"

export const handler = schedule("*/5 * * * *", async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ''

  try {
    const res = await fetch(`${siteUrl}/api/cron/analyze?cron_secret=${cronSecret}`)
    const data = await res.json()
    console.log('[scheduled-analyze]', data.message || data)
  } catch (e) {
    console.error('[scheduled-analyze] error:', e)
  }

  return { statusCode: 200 }
})
