import { NextResponse } from "next/server"
import { batchAnalyzeTenders } from "@/lib/ai"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const titles = [
      { id: "1", title: "臺灣銀行民生及華江分行電話總機系統汰舊換新採購案" },
      { id: "2", title: "頭前溪流域農業系統性節水田間灌溉管理智慧監測計畫" },
      { id: "3", title: "一般道路鋪設工程" }
    ]
    
    console.log("Testing batch AI analysis...")
    const scores = await batchAnalyzeTenders(titles)
    
    return NextResponse.json({
      success: true,
      scores,
      debug: "See server terminal for potential errors from lib/ai.ts"
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
