import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

// 清理 DB 中標題為 JS 程式碼的垃圾資料
export async function GET() {
  try {
    // 找出所有包含 Geps3 JS 程式碼的爛資料
    const badTenders = await db.tender.findMany({
      where: {
        title: {
          contains: "Geps3"
        }
      }
    })

    if (badTenders.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "DB 乾淨，沒有找到需要清理的資料" 
      })
    }

    // 刪除這些垃圾資料
    const deleted = await db.tender.deleteMany({
      where: {
        title: {
          contains: "Geps3"
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `已清理 ${deleted.count} 筆標題錯誤的資料，請重新執行 /api/cron/scrape`,
      deletedCount: deleted.count
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
