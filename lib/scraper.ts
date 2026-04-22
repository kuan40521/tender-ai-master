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
    
    // 3. 完美匹配您手動抓出 886 筆的參數
    const params = new URLSearchParams({
      "pageSize": "1000",       
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

    // 4. 單次發送請求
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

    // 【修復】直接以 id/class 精準選取結果表格
    // PCC 網站實際的結果表格是 table#tpam（class=tb_01），
    // 原本用文字過濾 .filter() 會先找到「搜尋表單」table（其 label 也含「機關名稱」），
    // 導致所有 row 都被 agency 保護判斷 skip 掉，結果永遠 0 筆。
    const table = $("table#tpam, table.tb_01").first()

    if (table) {
      table.find("tr").each((index, element) => {
        const tds = $(element).find("td")
        if (tds.length >= 8) {
          const agency = $(tds[1]).text().trim()
          const titleCell = $(tds[2])
          
          if (!agency || agency.includes("機關名稱") || agency.includes("◎")) return

          // ============================================================
          // 【修復核心 BUG】標案名稱解析錯誤
          //
          // PCC 網站 tds[2] 的 HTML 結構為：
          //   <td>
          //     <a href="...">案號（如 114F1234）</a>
          //     <br>
          //     標案名稱（如「114年度XX系統建置案」）
          //   </td>
          //
          // 原本程式做法：
          //   titleRaw = titleCell.text()  → 結果是 "案號 標案名稱" 合在一起
          //   再用 split(" ") 取 [1] 之後 → 只取到案號！標案名稱完全丟失！
          //
          // 關鍵字「系統」「平台」等當然永遠比對不到，結果永遠 0 筆。
          //
          // 修復方案：用 cheerio 的 .html() 取 innerHTML，
          // 依 <br> 標籤分割，取第二段（真正的標案名稱）
          // ============================================================
          let title = ""
          const titleCellHtml = titleCell.html() || ""
          
          if (/<br\s*\/?>/i.test(titleCellHtml)) {
            // 用 <br> 分割，取第二段（真正的標案名稱）
            const parts = titleCellHtml.split(/<br\s*\/?>/i)
            if (parts.length >= 2) {
              // 移除 HTML 標籤，只保留純文字
              title = parts[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").trim()
            }
            // 若第二段為空，退而求其次取全部文字
            if (!title) {
              title = titleCell.text().replace(/\s+/g, " ").trim()
            }
          } else {
            // 無 <br> 的情況，直接取全部文字（向後相容）
            const titleRaw = titleCell.text().replace(/\s+/g, " ").trim()
            // 嘗試用空白切割，取第二段以後（避免只取到案號）
            if (titleRaw.includes(" ")) {
              const parts = titleRaw.split(" ")
              title = parts.length > 1 ? parts.slice(1).join(" ") : parts[0]
            } else {
              title = titleRaw
            }
          }

          // 清理多餘空白與換行
          title = title.replace(/\s+/g, " ").trim()

          // ============================================================
          // 【修復】PCC 網站用 JavaScript 混淆標案名稱
          // 標題文字被包在 Geps3.CNS.pageCode2Img("真正的標案名稱") 裡
          // 例如：var hw = Geps3.CNS.pageCode2Img("115年度XX系統建置案"); $("#1").html(hw);
          // 必須用 regex 提取引號內的真實名稱
          // ============================================================
          const gepsMatch = title.match(/Geps3\.CNS\.pageCode2Img\(["']([^"']+)["']\)/)
          if (gepsMatch && gepsMatch[1]) {
            title = gepsMatch[1].trim()
          }

          // 最終清理
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
    
    return { 
      tenders: allTenders, 
      rawHtml: `Broad search completed. Found ${allTenders.length} tenders.` 
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
