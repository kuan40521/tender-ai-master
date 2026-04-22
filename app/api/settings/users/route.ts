import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, username: true, name: true, email: true }
    })
    
    // 如果一個使用者都沒有，自動初始化一個預設帳號 admin / admin123
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      const admin = await db.user.create({
        data: {
          username: "admin",
          password: hashedPassword,
          name: "預設管理員"
        },
        select: { id: true, username: true, name: true, email: true }
      })
      return NextResponse.json([admin])
    }

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, name } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ error: "帳號與密碼為必填" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name
      }
    })

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
