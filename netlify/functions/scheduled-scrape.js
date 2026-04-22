const handler = async (event, context) => {
  const { SITE_URL, CRON_SECRET } = process.env;
  const url = `${SITE_URL}/api/cron/scrape?force=true&cron_secret=${CRON_SECRET}`;
  
  console.log(`[Scheduled Scrape] Triggering: ${url}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`[Scheduled Scrape] Success:`, data);
    return { statusCode: 200 };
  } catch (err) {
    console.error(`[Scheduled Scrape] Failed:`, err);
    return { statusCode: 500 };
  }
};

module.exports.handler = handler;
module.exports.config = {
  schedule: "30,55 3,16 * * *" // 11:30, 11:55 CST (上午) 和 00:00, 00:25 CST (午夜)
};
