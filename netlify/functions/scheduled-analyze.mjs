// 每 10 分鐘執行一次，處理尚未完成 AI 分析的標案（每次最多 25 筆）
export default async () => {
  const siteUrl = process.env.SITE_URL || process.env.URL
  const cronSecret = process.env.CRON_SECRET || ''

  try {
    const res = await fetch(`${siteUrl}/api/cron/analyze?cron_secret=${cronSecret}`)
    const data = await res.json()
    console.log('[scheduled-analyze]', data.message || data)
  } catch (e) {
    console.error('[scheduled-analyze] error:', e)
  }

  return new Response('OK')
}

export const config = {
  schedule: '*/5 * * * *'
}
