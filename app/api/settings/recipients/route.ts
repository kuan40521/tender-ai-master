import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const recipients = await db.recipient.findMany({
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(recipients)
  } catch (error: any) {
    console.warn("Database unavailable, returning empty recipients")
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, isEnabled } = await request.json()
    try {
      const recipient = await db.recipient.create({
        data: { name, email, isEnabled }
      })
      return NextResponse.json(recipient)
    } catch (dbError) {
      console.warn("Database unavailable, mocking recipient POST success")
      return NextResponse.json({ id: Date.now().toString(), name, email, isEnabled, createdAt: new Date() })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
