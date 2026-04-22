"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, ShieldCheck, Loader2 } from "lucide-react"

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch("/api/settings/users")
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) return
    
    const res = await fetch("/api/settings/users", {
      method: "POST",
      body: JSON.stringify({ username: newUsername, password: newPassword, name: newName }),
      headers: { "Content-Type": "application/json" }
    })
    
    if (res.ok) {
      setNewUsername("")
      setNewPassword("")
      setNewName("")
      fetchUsers()
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("確定要刪除此帳號嗎？")) return
    const res = await fetch("/api/settings/users", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" }
    })
    if (res.ok) fetchUsers()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">帳號權限管理</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>新增管理員</CardTitle>
            <CardDescription>手動建立新的登入帳號</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">登入帳號 (Username)</label>
              <Input 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)} 
                placeholder="例如: admin"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">登入密碼 (Password)</label>
              <Input 
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="請輸入密碼"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">顯示名稱 (Name)</label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="顯示在介面上的名字"
              />
            </div>
            <Button className="w-full" onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" /> 建立帳號
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>現有帳號清單</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>帳號</TableHead>
                    <TableHead>名稱</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                          {user.username}
                        </div>
                      </TableCell>
                      <TableCell>{user.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        尚無帳號資料
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
