// 每 10 分鐘執行一次，由 digest API 自行判斷是否為設定的郵件發送時間點
export default async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ''

  try {
    const res = await fetch(`${siteUrl}/api/cron/digest?cron_secret=${cronSecret}`)
    const data = await res.json()
    console.log('[scheduled-digest]', data.message || data)
  } catch (e) {
    console.error('[scheduled-digest] error:', e)
  }

  return new Response('OK')
}

export const config = {
  schedule: '*/10 * * * *'
}
