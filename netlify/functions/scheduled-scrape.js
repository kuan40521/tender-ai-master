// 智慧連動版本：每小時的 0, 15, 30, 45 分醒來
export const handler = async (event, context) => {
  const { SITE_URL, CRON_SECRET } = process.env;
  
  // 呼叫系統內建的 API，讓它去比對「資料庫裡的排程時間」
  const url = `${SITE_URL}/api/cron/scrape?cron_secret=${CRON_SECRET}`;
  
  console.log(`[Heartbeat] 啟動檢查：${new Date().toLocaleString("zh-TW", {timeZone:"Asia/Taipei"})}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};

export const config = {
  schedule: "* * * * *" // 每分鐘都醒來檢查，精準對時
};
