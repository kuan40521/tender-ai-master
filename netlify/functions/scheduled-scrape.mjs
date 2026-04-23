// 每 10 分鐘執行一次，由 scrape API 自行判斷是否為設定的排程時間點
export default async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ''

  try {
    const res = await fetch(`${siteUrl}/api/cron/scrape?cron_secret=${cronSecret}`)
    const data = await res.json()
    console.log('[scheduled-scrape]', data.message || data)
  } catch (e) {
    console.error('[scheduled-scrape] error:', e)
  }

  return new Response('OK')
}

export const config = {
  schedule: '*/10 * * * *'
}
