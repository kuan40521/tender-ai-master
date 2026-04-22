export default async (req, context) => {
  const { SITE_URL, CRON_SECRET } = process.env;
  const url = `${SITE_URL}/api/cron/scrape?force=true&cron_secret=${CRON_SECRET}`;
  
  console.log(`[Scheduled Scrape] ESM Triggering: ${url}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`[Scheduled Scrape] Success:`, data);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(`[Scheduled Scrape] Failed:`, err);
    return new Response("Error", { status: 500 });
  }
};

export const config = {
  schedule: "30,55 3,16 * * *"
};
