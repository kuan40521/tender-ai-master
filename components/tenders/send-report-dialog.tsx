"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface SendReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendReportDialog({ open, onOpenChange }: SendReportDialogProps) {
  const [threshold, setThreshold] = useState(70)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)
    try {
      const res = await fetch("/api/tenders/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        onOpenChange(false)
      } else {
        toast.error(data.message || "發送失敗")
      }
    } catch {
      toast.error("無法連線至伺服器")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            立即發送情報郵件
          </DialogTitle>
          <DialogDescription>
            立即將 DB 中符合條件的標案發送給所有已啟用的收件人，不受排程時間限制。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI 信心度門檻</span>
              <span className="text-sm font-semibold tabular-nums text-primary">≥ {threshold}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[threshold]}
              onValueChange={(v) => setThreshold(v[0])}
            />
            <div className="flex gap-2">
              {[70, 80, 90].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setThreshold(v)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    threshold === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <p className="rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            將發送 DB 中所有信心度 ≥ {threshold}% 的標案給已啟用的收件人。收件人設定請至「系統設定與通知」管理。
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            取消
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
            {isSending ? "發送中..." : "確認發送"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
