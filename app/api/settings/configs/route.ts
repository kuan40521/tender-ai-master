import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const configs = await db.config.findMany()
    const configMap = configs.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})
    return NextResponse.json(configMap)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    // data example: { "threshold": "90", "dailyTime": "17:30" }
    
    const upserts = Object.entries(data).map(([key, value]) => {
      return db.config.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    })
    
    await Promise.all(upserts)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
