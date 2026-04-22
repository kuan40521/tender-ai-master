"use client"

import { Search, SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"

export type StatusFilter = "all" | "new" | "favorited" | "ignored"
export type ConfidenceRange = [number, number]

interface TenderFiltersProps {
  query: string
  onQueryChange: (q: string) => void
  status: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  confidence: ConfidenceRange
  onConfidenceChange: (range: ConfidenceRange) => void
  date: string
  onDateChange: (d: string) => void
  totalCount: number
  filteredCount: number
  onRefresh?: () => void
  isRefreshing?: boolean
  onClearAll?: () => void
  isClearing?: boolean
  confirmClear?: boolean
  onExport?: () => void
  onReAnalyze?: () => void
  isAnalyzing?: boolean
}

export function TenderFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  confidence,
  onConfidenceChange,
  date,
  onDateChange,
  totalCount,
  filteredCount,
  onRefresh,
  isRefreshing,
  onClearAll,
  isClearing,
  confirmClear,
  onExport,
  onReAnalyze,
  isAnalyzing,
}: TenderFiltersProps) {
  const isConfidenceFiltered = confidence[0] > 0 || confidence[1] < 100
  const activeChips: Array<{ label: string; onRemove: () => void }> = []

  if (status !== "all") {
    const labelMap: Record<StatusFilter, string> = {
      all: "",
      new: "新案件",
      favorited: "收藏",
      ignored: "已忽略",
    }
    activeChips.push({
      label: `狀態：${labelMap[status]}`,
      onRemove: () => onStatusChange("all"),
    })
  }
  if (isConfidenceFiltered) {
    activeChips.push({
      label: `信心度 ${confidence[0]}% – ${confidence[1]}%`,
      onRemove: () => onConfidenceChange([0, 100]),
    })
  }
  if (query) {
    activeChips.push({
      label: `關鍵字：${query}`,
      onRemove: () => onQueryChange(""),
    })
  }

  if (date) {
    activeChips.push({
      label: `日期：${date}`,
      onRemove: () => onDateChange(""),
    })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="搜尋標案名稱、機關或標籤…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              aria-label="搜尋標案"
            />
          </InputGroup>
        </div>

        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as StatusFilter)}
        >
          <SelectTrigger className="w-[140px]" aria-label="狀態篩選">
            <SelectValue placeholder="狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="new">新案件</SelectItem>
            <SelectItem value="favorited">已收藏</SelectItem>
            <SelectItem value="ignored">已忽略</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5" aria-label="信心度">
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">信心度</span>
              <span className="tabular-nums text-muted-foreground">
                {confidence[0]}–{confidence[1]}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">信心度區間</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {confidence[0]}% – {confidence[1]}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={confidence}
                onValueChange={(v) =>
                  onConfidenceChange([v[0], v[1]] as ConfidenceRange)
                }
                aria-label="信心度區間"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onConfidenceChange([80, 100])}
                >
                  僅高價值
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onConfidenceChange([0, 100])}
                >
                  重設
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <span className="mr-2 text-sm italic">📅</span>
              {date || "選擇民國日期"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={(() => {
                if (!date) return undefined
                const parts = date.split("/")
                if (parts.length === 3) {
                  const westernYear = parseInt(parts[0]) + 1911
                  const month = parseInt(parts[1]) - 1
                  const day = parseInt(parts[2])
                  return new Date(westernYear, month, day)
                }
                return undefined
              })()}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  const minguoYear = selectedDate.getFullYear() - 1911
                  const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
                  const day = String(selectedDate.getDate()).padStart(2, "0")
                  onDateChange(`${minguoYear}/${month}/${day}`)
                } else {
                  onDateChange("")
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {onRefresh && (
          <div className="flex gap-2 flex-wrap">
            {onExport && (
              <Button variant="outline" className="gap-2" onClick={onExport}>
                <span className="text-sm">📥</span>
                匯出 CSV
              </Button>
            )}
            {onReAnalyze && (
              <Button
                variant="outline"
                className="gap-2 border-blue-500/50 text-blue-600 hover:bg-blue-50"
                onClick={onReAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <span className="text-sm">🤖</span>
                )}
                {isAnalyzing ? "AI 分析中..." : "AI 重新分析"}
              </Button>
            )}
            <Button 
              variant="default" 
              className="gap-2" 
              onClick={onRefresh} 
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <span className="animate-spin text-sm">↻</span>
              ) : (
                <span className="text-sm">↻</span>
              )}
              手動更新
            </Button>
            {onClearAll && (
              <Button 
                variant={confirmClear ? "outline" : "destructive"}
                className={confirmClear 
                  ? "gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 animate-pulse" 
                  : "gap-2"
                }
                onClick={onClearAll} 
                disabled={isClearing}
              >
                {isClearing ? "刪除中..." : confirmClear ? "⚠️ 確認刪除？" : "一鍵刪除"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          顯示 <span className="font-medium tabular-nums text-foreground">{filteredCount}</span> / {totalCount} 件
        </span>
        {activeChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <Badge
                key={chip.label}
                variant="secondary"
                className="h-6 gap-1 pr-1 text-[11px] font-normal"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="ml-0.5 inline-flex size-4 items-center justify-center rounded hover:bg-background"
                  aria-label={`移除篩選：${chip.label}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
