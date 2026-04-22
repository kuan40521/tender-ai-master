"use client"

import { useState, useEffect } from "react"
import { BellRing, Save, Zap, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function AlertRules() {
  const [threshold, setThreshold] = useState(90)
  const [dailyTimes, setDailyTimes] = useState<string[]>(["17:30"])
  const [scrapeTimes, setScrapeTimes] = useState<string[]>(["09:00"])
  const [dailyDigest, setDailyDigest] = useState(true)
  const [lineEnabled, setLineEnabled] = useState(false)


  const [newScrapeTime, setNewScrapeTime] = useState("10:00")
  const [newTotalTime, setNewTotalTime] = useState("18:00")

  useEffect(() => {
    fetch("/api/settings/configs")
      .then(res => res.json())
      .then(data => {
        if (data.threshold) setThreshold(Number(data.threshold))
        if (data.dailyTimes) setDailyTimes(JSON.parse(data.dailyTimes))
        if (data.scrapeTimes) setScrapeTimes(JSON.parse(data.scrapeTimes))
        if (data.dailyDigest) setDailyDigest(data.dailyDigest === "true")
      })
  }, [])


  const save = async () => {
    try {
      const res = await fetch("/api/settings/configs", {
        method: "POST",
        body: JSON.stringify({
          threshold,
          dailyTimes: JSON.stringify(dailyTimes),
          scrapeTimes: JSON.stringify(scrapeTimes),
          dailyDigest
        })
      })
      if (res.ok) {
        toast.success("系統配置已儲存")
      }
    } catch (e) {
      toast.error("儲存失敗")
    }
  }

  const addScrapeTime = () => {
     if (scrapeTimes.includes(newScrapeTime)) return
     setScrapeTimes([...scrapeTimes, newScrapeTime].sort())
  }
  const addDailyTime = () => {
     if (dailyTimes.includes(newTotalTime)) return
     setDailyTimes([...dailyTimes, newTotalTime].sort())
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-border">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="size-4 text-primary" />
            通知規則設定
          </CardTitle>
          <CardDescription>
            設定即時觸發條件與每日匯總報告的發送時間。
          </CardDescription>
        </div>
        <Button size="sm" onClick={save} className="gap-1.5">
          <Save className="size-3.5" />
          儲存
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-5">
        {/* Daily digest */}
        <section className="flex flex-col gap-5 rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"
                aria-hidden
              >
                <BellRing className="size-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm font-medium">每日匯總報告</Label>
                <span className="text-xs text-muted-foreground">
                  依據設定時間與信心度篩選，發送當日高品質案件清單。
                </span>
              </div>
            </div>
            <Switch
              checked={dailyDigest}
              onCheckedChange={setDailyDigest}
              aria-label="切換每日匯總"
            />
          </div>

          <div className="flex flex-col gap-4 pl-12">
            <div className="flex flex-col gap-2 border-b border-border pb-4">
               <div className="flex items-center justify-between">
                 <Label className="text-xs font-medium">篩選信心度閾值</Label>
                 <span className="text-xs font-semibold text-primary">≥ {threshold}%</span>
               </div>
               <p className="text-[11px] text-muted-foreground">系統僅會將 AI 判定高於此分數的標案納入每日報告中。</p>
               <Slider
                 min={0}
                 max={100}
                 step={5}
                 value={[threshold]}
                 onValueChange={(v) => setThreshold(v[0])}
                 disabled={!dailyDigest}
               />
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-xs text-muted-foreground">自動發送時間點</Label>
              <div className="flex flex-wrap gap-2">
                {dailyTimes.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1 font-mono text-sm">
                    {t}
                    <button onClick={() => setDailyTimes(dailyTimes.filter(x => x !== t))} className="rounded-full hover:bg-muted p-0.5" disabled={!dailyDigest}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex max-w-[240px] items-center gap-2">
                <Input
                  type="time"
                  value={newTotalTime}
                  onChange={(e) => setNewTotalTime(e.target.value)}
                  disabled={!dailyDigest}
                  className="tabular-nums"
                />
                <Button size="icon" variant="outline" onClick={addDailyTime} disabled={!dailyDigest}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Crawler Scheduling */}
        <section className="flex flex-col gap-4 rounded-lg border border-border p-4 bg-muted/20">
          <div className="flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground" aria-hidden>
              <Zap className="size-4" />
            </span>
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm font-medium">多重爬蟲排程</Label>
              <span className="text-xs text-muted-foreground">設定每日自動抓取的時間點（支援多個時段）。</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 pl-12">
            <Label className="text-xs text-muted-foreground">目前排程</Label>
            <div className="flex flex-wrap gap-2">
              {scrapeTimes.map(t => (
                <Badge key={t} variant="outline" className="gap-1 pr-1 font-mono text-sm bg-background">
                  {t}
                  <button onClick={() => setScrapeTimes(scrapeTimes.filter(x => x !== t))} className="rounded-full hover:bg-muted p-0.5">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex max-w-[240px] items-center gap-2">
              <Input
                type="time"
                value={newScrapeTime}
                onChange={(e) => setNewScrapeTime(e.target.value)}
                className="tabular-nums"
              />
              <Button size="icon" variant="outline" onClick={addScrapeTime}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <Separator />

        {/* Channels */}
        <section className="flex flex-col gap-3">
          <Label className="text-sm font-medium">推播渠道</Label>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-sm">Email</span>
              <span className="text-xs text-muted-foreground">
                依據收件人清單發送至啟用中的 Email。
              </span>
            </div>
            <Switch defaultChecked aria-label="Email 推播" />
          </div>

          <div className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2.5">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm">Line Notify</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  即將推出
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                綁定 Token 後可推送至個人或群組。
              </span>
            </div>
            <Switch
              checked={lineEnabled}
              onCheckedChange={setLineEnabled}
              disabled
              aria-label="Line Notify 推播"
            />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
