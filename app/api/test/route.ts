import { NextResponse } from "next/server"

export async function GET() {
  try {
    const todayStr = "2026/04/21"
    const params = new URLSearchParams({
      "pageSize": "10",
      "firstSearch": "false",
      "searchType": "basic",
      "isBinding": "N",
      "isLogIn": "N",
      "level_1": "on",
      "tenderType": "TENDER_DECLARATION",
      "tenderWay": "TENDER_WAY_ALL_DECLARATION",
      "dateType": "isDate",
      "tenderStartDate": todayStr,
      "tenderEndDate": todayStr
    })

    const response = await fetch(`https://web.pcc.gov.tw/prkms/tender/common/basic/readTenderBasic?${params.toString()}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store"
    })
    const html = await response.text()
    
    // Return as plain text to avoid markdown conversion
    return new NextResponse(html, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  } catch (e: any) {
    return new NextResponse(e.message, { status: 500 })
  }
}
