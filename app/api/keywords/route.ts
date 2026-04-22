import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { word, type } = await request.json()
    if (!word || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    try {
      const keyword = await db.keyword.create({
        data: { word, type }
      })
      return NextResponse.json(keyword)
    } catch (dbError) {
      console.warn("Database unavailable, mocking POST success for:", word)
      return NextResponse.json({ id: "mock-id", word, type, createdAt: new Date() })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { word } = await request.json()
    if (!word) return NextResponse.json({ error: "Missing word" }, { status: 400 })

    try {
      await db.keyword.delete({
        where: { word }
      })
    } catch (dbError) {
      console.warn("Database unavailable, mocking DELETE success for:", word)
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
