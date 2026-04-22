import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api/cron';

console.log('🚀 本地排程守護程式已啟動...');
console.log('監控中：爬蟲排程與每日報告發送...');

async function checkAndRun() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  try {
    const configs = await prisma.config.findMany();
    const configMap = Object.fromEntries(configs.map(c => [c.key, c.value]));
    
    const scrapeTimes = JSON.parse(configMap.scrapeTimes || '[]');
    const dailyTimes = JSON.parse(configMap.dailyTimes || '[]');

    // 檢查爬蟲
    if (scrapeTimes.includes(currentTime)) {
      console.log(`[${currentTime}] 觸發自動爬蟲...`);
      const res = await fetch(`${API_BASE}/scrape`);
      const data = await res.json();
      console.log('結果:', data.message || data);
    }

    // 檢查每日報告
    if (dailyTimes.includes(currentTime)) {
      console.log(`[${currentTime}] 觸發每日情報報告發送...`);
      const res = await fetch(`${API_BASE}/digest`);
      const data = await res.json();
      console.log('結果:', data.message || data);
    }

  } catch (error) {
    console.error('排程檢查出錯:', error.message);
  }
}

// 每分鐘檢查一次 (精確到秒)
setInterval(() => {
  const seconds = new Date().getSeconds();
  if (seconds === 0) {
    checkAndRun();
  }
}, 1000);

// 啟動時先檢查一次
checkAndRun();
