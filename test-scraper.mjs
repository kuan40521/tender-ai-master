// 快速測試爬蟲分頁邏輯（不需要 DB）
import * as cheerio from "cheerio"

const indexUrl = "https://web.pcc.gov.tw/prkms/tender/common/basic/indexTenderBasic"
const searchUrl = "https://web.pcc.gov.tw/prkms/tender/common/basic/readTenderBasic"
const PAGE_SIZE = 100

async function testScraper() {
  console.log("=== 測試 PCC 爬蟲分頁 ===\n")

  // 取 Cookie
  const indexRes = await fetch(indexUrl, { cache: 'no-store' })
  const cookie = indexRes.headers.get("set-cookie") || ""
  console.log(`Cookie: ${cookie ? "✓ 取得" : "✗ 失敗"}`)

  // 今天日期 (台北時間)
  const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
  const now = new Date(nowStr)
  const todayStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  console.log(`日期: ${todayStr}\n`)

  let allTenders = []
  let pageIndex = 1

  while (pageIndex <= 10) { // 測試只跑最多 10 頁
    const params = new URLSearchParams({
      "pageSize": String(PAGE_SIZE),
      "pageIndex": String(pageIndex),
      "firstSearch": "false",
      "searchType": "basic",
      "isBinding": "N",
      "isLogIn": "N",
      "level_1": "on",
      "orgName": "",
      "orgId": "",
      "tenderName": "",
      "tenderId": "",
      "tenderType": "TENDER_DECLARATION",
      "tenderWay": "TENDER_WAY_ALL_DECLARATION",
      "dateType": "isDate",
      "tenderStartDate": todayStr,
      "tenderEndDate": todayStr,
      "radProctrgCate": "",
      "policyAdvocacy": ""
    })

    const response = await fetch(`${searchUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": indexUrl,
        "Cookie": cookie
      },
      cache: 'no-store'
    })

    const html = await response.text()
    const $ = cheerio.load(html)
    const pageTenders = []

    const table = $("table#tpam, table.tb_01").first()
    table.find("tr").each((i, el) => {
      const tds = $(el).find("td")
      if (tds.length >= 8) {
        const agency = $(tds[1]).text().trim()
        if (!agency || agency.includes("機關名稱") || agency.includes("◎")) return
        pageTenders.push(agency)
      }
    })

    allTenders.push(...pageTenders)
    console.log(`第 ${pageIndex} 頁：${pageTenders.length} 筆 (累計: ${allTenders.length})`)

    if (pageTenders.length < PAGE_SIZE) {
      console.log(`\n→ 最後一頁，停止分頁`)
      break
    }

    pageIndex++
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n=== 結果 ===`)
  console.log(`總計: ${allTenders.length} 筆`)
  console.log(`共 ${pageIndex} 頁`)

  if (allTenders.length > 0) {
    console.log(`\n分頁功能: ✓ 正常`)
    if (pageIndex > 1) {
      console.log(`分頁抓取: ✓ 成功抓到超過第 1 頁的資料`)
    } else {
      console.log(`今天資料量 < ${PAGE_SIZE} 筆，只需 1 頁`)
    }
  } else {
    console.log(`\n⚠ 警告：0 筆資料，可能 PCC 連線有問題`)
  }
}

testScraper().catch(console.error)
