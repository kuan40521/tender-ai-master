export default async (req, context) => {
  const { SITE_URL, CRON_SECRET } = process.env;
  const url = `${SITE_URL}/api/cron/digest?cron_secret=${CRON_SECRET}`;
  
  console.log(`[Scheduled Digest] ESM Triggering: ${url}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`[Scheduled Digest] Success:`, data);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(`[Scheduled Digest] Failed:`, err);
    return new Response("Error", { status: 500 });
  }
};

export const config = {
  schedule: "30 9 * * *"
};
