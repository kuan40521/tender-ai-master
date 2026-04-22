import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export const dynamic = 'force-dynamic'

// DELETE: 前端「一鍵刪除」按鈕呼叫
export async function DELETE() {
  try {
    const deleted = await db.tender.deleteMany({})
    
    // 強制讓 Next.js 清除快取，讓所有標案頁面立刻重新整理
    revalidatePath("/tenders")
    revalidatePath("/")

    return NextResponse.json({ success: true, message: `已從雲端清除全部 ${deleted.count} 筆標案資料` })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET: 也支援 GET 方便瀏覽器直接測試
export async function GET() {
  try {
    const deleted = await db.tender.deleteMany({})
    
    revalidatePath("/tenders")
    revalidatePath("/")

    return NextResponse.json({ success: true, message: `已從雲端清除全部 ${deleted.count} 筆標案資料` })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
