"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Save, Bot } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function AiPromptEditor({ initialPrompt }: { initialPrompt: string }) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/settings/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_prompt: prompt })
      })
      if (res.ok) {
        toast.success("AI 提示詞已更新！下次執行分析時將套用新規則。")
      } else {
        toast.error("儲存失敗")
      }
    } catch (e) {
      toast.error("儲存發生錯誤")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm mt-6">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <Bot className="size-5" />
          AI 分析提示詞 (Prompt) 編輯器
        </CardTitle>
        <CardDescription>
          您可以自由修改 AI 的核心大腦，自訂評分標準與偏好。您的正向/負向關鍵字依然會自動注入到最優先級別。
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-4">
        <Textarea
          className="min-h-[250px] font-mono text-sm leading-relaxed"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="請輸入 AI 提示詞..."
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="size-4" />
            {isSaving ? "儲存中..." : "儲存提示詞"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
