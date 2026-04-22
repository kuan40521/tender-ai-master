const handler = async (event, context) => {
  const { SITE_URL, CRON_SECRET } = process.env;
  const url = `${SITE_URL}/api/cron/digest?cron_secret=${CRON_SECRET}`;
  
  console.log(`[Scheduled Digest] Triggering: ${url}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`[Scheduled Digest] Success:`, data);
    return { statusCode: 200 };
  } catch (err) {
    console.error(`[Scheduled Digest] Failed:`, err);
    return { statusCode: 500 };
  }
};

module.exports.handler = handler;
module.exports.config = {
  schedule: "30 9 * * *" // 17:30 CST
};
