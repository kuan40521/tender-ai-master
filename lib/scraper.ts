import * as cheerio from "cheerio"

export interface ScrapedTender {
  agency: string
  title: string
  budget: string
  releaseDate: string
  dueDate: string
  url: string
  biddingType: string
  procurementType: string
}

export async function scrapeTodayTenders(_positiveKeywords?: string[], targetDate?: string): Promise<{ tenders: ScrapedTender[], rawHtml: string }> {
  try {
    const indexUrl = "https://web.pcc.gov.tw/prkms/tender/common/basic/indexTenderBasic"
    const searchUrl = "https://web.pcc.gov.tw/prkms/tender/common/basic/readTenderBasic"
    
    // 1. 拿 Cookie
    const indexRes = await fetch(indexUrl, { cache: 'no-store' })
    const cookie = indexRes.headers.get("set-cookie") || ""
    
    // 2. 設定日期
    let finalDateStr = ""
    
    if (targetDate && targetDate.includes("/")) {
      // 如果有傳入民國日期 (例如 113/04/22)
      const parts = targetDate.split("/")
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10) + 1911
        const month = parts[1].padStart(2, '0')
        const day = parts[2].padStart(2, '0')
        finalDateStr = `${year}/${month}/${day}`
      }
    }

    if (!finalDateStr) {
      // 預設抓取今天 (台北時間)
      const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
      const now = new Date(nowStr)
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      finalDateStr = `${year}/${month}/${day}`
    }

    const todayStr = finalDateStr
    console.log(`[Scraper] Target searching date (Western): ${todayStr}`)

    // PCC 不支援分頁參數，直接用大 pageSize 一次取回所有資料
    // 實測：pageSize=5000 可正常回傳全部筆數（今日最多約數千筆）
    const params = new URLSearchParams({
      "pageSize": "5000",
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
    const allTenders: ScrapedTender[] = []

    const table = $("table#tpam, table.tb_01").first()

    if (table) {
      table.find("tr").each((index, element) => {
        const tds = $(element).find("td")
        if (tds.length >= 8) {
          const agency = $(tds[1]).text().trim()
          const titleCell = $(tds[2])

          if (!agency || agency.includes("機關名稱") || agency.includes("◎")) return

          let title = ""
          const titleCellHtml = titleCell.html() || ""

          if (/<br\s*\/?>/i.test(titleCellHtml)) {
            const parts = titleCellHtml.split(/<br\s*\/?>/i)
            if (parts.length >= 2) {
              title = parts[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim()
            }
            if (!title) {
              title = titleCell.text().replace(/\s+/g, " ").trim()
            }
          } else {
            const titleRaw = titleCell.text().replace(/\s+/g, " ").trim()
            if (titleRaw.includes(" ")) {
              const parts = titleRaw.split(" ")
              title = parts.length > 1 ? parts.slice(1).join(" ") : parts[0]
            } else {
              title = titleRaw
            }
          }

          title = title.replace(/\s+/g, " ").trim()

          const gepsMatch = title.match(/Geps3\.CNS\.pageCode2Img\(["']([^"']+)["']\)/)
          if (gepsMatch && gepsMatch[1]) {
            title = gepsMatch[1].trim()
          }

          title = title.replace(/\s+/g, " ").trim()

          if (title.length < 2) return

          let tenderUrl = titleCell.find("a").attr("href") || ""
          if (tenderUrl && !tenderUrl.startsWith("http")) {
            tenderUrl = `https://web.pcc.gov.tw${tenderUrl.startsWith("/") ? "" : "/"}${tenderUrl}`
          }

          allTenders.push({
            agency,
            title,
            budget: $(tds[8]).text().trim(),
            releaseDate: $(tds[6]).text().trim(),
            dueDate: $(tds[7]).text().trim(),
            url: tenderUrl,
            biddingType: $(tds[4]).text().trim(),
            procurementType: $(tds[5]).text().trim()
          })
        }
      })
    }

    console.log(`[Scraper] Fetched ${allTenders.length} tenders for ${todayStr}`)

    return {
      tenders: allTenders,
      rawHtml: `Fetched ${allTenders.length} tenders.`
    }
  } catch (error: any) {
    console.error("Scraping error:", error)
    return { tenders: [], rawHtml: `Error: ${error.message}` }
  }
}

export function filterTenders(
  tenders: ScrapedTender[],
  positiveKeywords: string[],
  negativeKeywords: string[]
): ScrapedTender[] {
  return tenders.filter((tender) => {
    const fullText = `${tender.title} ${tender.agency}`
    
    // 中文字元不需要 toLowerCase，直接做 includes 比對即可
    const hasNegative = negativeKeywords.some((word) => fullText.includes(word))
    if (hasNegative) return false

    if (positiveKeywords.length === 0) return true
    return positiveKeywords.some((word) => fullText.includes(word))
  })
}
