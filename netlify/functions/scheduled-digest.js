export const handler = async (event, context) => {
  const { SITE_URL, CRON_SECRET } = process.env;
  
  // 呼叫發報 API
  const url = `${SITE_URL}/api/cron/digest?cron_secret=${CRON_SECRET}`;
  
  console.log(`[Digest Heartbeat] 啟動檢查：${new Date().toLocaleString("zh-TW", {timeZone:"Asia/Taipei"})}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};

export const config = {
  schedule: "45 * * * *" // 每小時的 45 分醒來檢查發報
};
