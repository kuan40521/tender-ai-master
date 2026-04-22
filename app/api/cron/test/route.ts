import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const indexUrl = "https://web.pcc.gov.tw/prkms/tender/common/basic/indexTenderBasic"
    const searchUrl = "https://web.pcc.gov.tw/prkms/tender/common/basic/readTenderBasic"

    // Step 1: 先拿 Cookie
    let cookie = ""
    try {
      const indexRes = await fetch(indexUrl, {
        cache: 'no-store',
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      })
      cookie = indexRes.headers.get("set-cookie") || ""
    } catch (e: any) {
      return NextResponse.json({ step: "indexFetch", error: e.message })
    }

    // Step 2: 計算今天日期
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    const now = new Date(nowStr)
    const todayStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`

    // Step 3: 發送查詢請求
    const params = new URLSearchParams({
      "pageSize": "50",
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        "Referer": indexUrl,
        "Cookie": cookie
      },
      cache: 'no-store'
    })

    const html = await response.text()
    const $ = cheerio.load(html)

    // 分析 HTML 結構
    const allTables = $("table")
    const tableInfo: any[] = []
    allTables.each((i, el) => {
      const text = $(el).text().substring(0, 100).replace(/\s+/g, " ").trim()
      tableInfo.push({
        index: i,
        class: $(el).attr("class") || "",
        id: $(el).attr("id") || "",
        rowCount: $(el).find("tr").length,
        preview: text
      })
    })

    // 找目標 table
    const targetTable = $("table.table_list, table#resultTable, table").filter((i, el) => {
      return $(el).text().includes("機關名稱") && $(el).text().includes("標案名稱")
    }).first()

    let firstRowTds: string[] = []
    let firstRowHtml = ""
    if (targetTable.length > 0) {
      const rows = targetTable.find("tr")
      // 找第一個有 td 的 row（跳過 header）
      rows.each((i, row) => {
        const tds = $(row).find("td")
        if (tds.length >= 5 && firstRowTds.length === 0) {
          firstRowHtml = $(row).html()?.substring(0, 1000) || ""
          tds.each((j, td) => {
            firstRowTds.push(`[td${j}]: ${$(td).text().replace(/\s+/g, " ").trim().substring(0, 80)}`)
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      todayStr,
      cookieObtained: !!cookie,
      httpStatus: response.status,
      htmlLength: html.length,
      // 回傳原始 HTML 前 3000 字元
      htmlPreview: html.substring(0, 3000),
      // 包含 "機關名稱" 的位置
      contains機關名稱: html.includes("機關名稱"),
      contains標案名稱: html.includes("標案名稱"),
      containsTableList: html.includes("table_list"),
      // Table 分析
      totalTables: allTables.length,
      tableInfo,
      // 目標 table 分析
      targetTableFound: targetTable.length > 0,
      firstDataRowTds: firstRowTds,
      firstDataRowHtml: firstRowHtml,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, stack: e.stack })
  }
}
