"use client"

import { useState, useEffect, useRef } from "react"
import { Search, SlidersHorizontal, X, DollarSign, ChevronDown, Download, RotateCcw, Sparkles, Trash2, ArrowUpDown, Mail } from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { type BudgetRange } from "@/components/tenders/tenders-view"
import { SendReportDialog } from "@/components/tenders/send-report-dialog"

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
  budgetRange: BudgetRange
  onBudgetRangeChange: (r: BudgetRange) => void
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
  sort?: string
  onSortChange?: (s: string) => void
  procurementType?: string
  onProcurementTypeChange?: (pt: string) => void
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
  budgetRange,
  onBudgetRangeChange,
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
  sort = "confidence",
  onSortChange,
  procurementType = "",
  onProcurementTypeChange,
}: TenderFiltersProps) {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [budgetMinInput, setBudgetMinInput] = useState(budgetRange[0] !== null ? String(budgetRange[0]) : "")
  const [budgetMaxInput, setBudgetMaxInput] = useState(budgetRange[1] !== null ? String(budgetRange[1]) : "")
  const [localQuery, setLocalQuery] = useState(query)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync localQuery when parent clears the query (e.g. chip remove)
  useEffect(() => {
    setLocalQuery(query)
  }, [query])

  const handleQueryChange = (value: string) => {
    setLocalQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onQueryChange(value)
    }, 300)
  }

  const handleQueryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onQueryChange(localQuery)
    }
  }

  const applyBudget = () => {
    const min = budgetMinInput === "" ? null : parseInt(budgetMinInput)
    const max = budgetMaxInput === "" ? null : parseInt(budgetMaxInput)
    onBudgetRangeChange([isNaN(min as number) ? null : min, isNaN(max as number) ? null : max])
  }

  const resetBudget = () => {
    setBudgetMinInput("")
    setBudgetMaxInput("")
    onBudgetRangeChange([null, null])
  }

  const isConfidenceFiltered = confidence[0] > 0 || confidence[1] < 100
  const isBudgetFiltered = budgetRange[0] !== null || budgetRange[1] !== null

  const activeChips: Array<{ label: string; onRemove: () => void }> = []

  if (status !== "all") {
    const labelMap: Record<StatusFilter, string> = { all: "", new: "新案件", favorited: "收藏", ignored: "已忽略" }
    activeChips.push({ label: `狀態：${labelMap[status]}`, onRemove: () => onStatusChange("all") })
  }
  if (isConfidenceFiltered) {
    activeChips.push({
      label: `信心度 ${confidence[0]}%–${confidence[1]}%`,
      onRemove: () => onConfidenceChange([0, 100]),
    })
  }
  if (query) {
    activeChips.push({ label: `關鍵字：${query}`, onRemove: () => onQueryChange("") })
  }
  if (procurementType === "all") {
    activeChips.push({ label: "採購類別：全部", onRemove: () => onProcurementTypeChange?.("勞務類") })
  }
  if (date) {
    activeChips.push({ label: `日期：${date}`, onRemove: () => onDateChange("") })
  }
  if (isBudgetFiltered) {
    const minLabel = budgetRange[0] !== null ? `${budgetRange[0]}萬` : "不限"
    const maxLabel = budgetRange[1] !== null ? `${budgetRange[1]}萬` : "不限"
    activeChips.push({ label: `金額：${minLabel}–${maxLabel}`, onRemove: resetBudget })
  }

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        {/* 搜尋 */}
        <div className="min-w-0 flex-1">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="搜尋標案名稱、機關或標籤…"
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleQueryKeyDown}
              aria-label="搜尋標案"
            />
          </InputGroup>
        </div>

        {/* 狀態 */}
        <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
          <SelectTrigger className="w-[130px]" aria-label="狀態篩選">
            <SelectValue placeholder="狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="new">新案件</SelectItem>
            <SelectItem value="favorited">已收藏</SelectItem>
            <SelectItem value="ignored">已忽略</SelectItem>
          </SelectContent>
        </Select>

        {/* 排序 */}
        {onSortChange && (
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[150px]" aria-label="排序方式">
              <ArrowUpDown className="mr-1.5 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confidence">AI 信心度</SelectItem>
              <SelectItem value="createdAt">最新加入</SelectItem>
              <SelectItem value="dueDate">截止日最近</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* 信心度 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("gap-1.5", isConfidenceFiltered && "border-primary/50 bg-primary/5 text-primary")}
              aria-label="信心度"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">信心度</span>
              <span className="tabular-nums text-muted-foreground text-xs">
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
                min={0} max={100} step={5}
                value={confidence}
                onValueChange={(v) => onConfidenceChange([v[0], v[1]] as ConfidenceRange)}
                aria-label="信心度區間"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onConfidenceChange([80, 100])}>
                  僅高價值
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onConfidenceChange([0, 100])}>
                  重設
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 金額篩選 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("gap-1.5", isBudgetFiltered && "border-primary/50 bg-primary/5 text-primary")}
              aria-label="金額範圍"
            >
              <DollarSign className="size-3.5" />
              <span className="hidden sm:inline">金額</span>
              {isBudgetFiltered ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {budgetRange[0] ?? "∞"}–{budgetRange[1] ?? "∞"}萬
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">全部</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-4">
            <div className="flex flex-col gap-4">
              <span className="text-sm font-medium">預算範圍（萬元）</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低"
                  value={budgetMinInput}
                  onChange={(e) => setBudgetMinInput(e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={budgetMaxInput}
                  onChange={(e) => setBudgetMaxInput(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "100–500萬", min: 100, max: 500 },
                  { label: "200–2000萬", min: 200, max: 2000 },
                  { label: "2000萬以上", min: 2000, max: null },
                ].map(({ label, min, max }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setBudgetMinInput(String(min))
                      setBudgetMaxInput(max !== null ? String(max) : "")
                      onBudgetRangeChange([min, max])
                    }}
                    className="rounded-md border border-dashed border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:border-solid hover:bg-muted hover:text-foreground"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={applyBudget}>套用</Button>
                <Button variant="outline" size="sm" onClick={resetBudget}>重設</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 日期 */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[160px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <span className="mr-2 text-sm">📅</span>
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
                  return new Date(parseInt(parts[0]) + 1911, parseInt(parts[1]) - 1, parseInt(parts[2]))
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
                setDatePickerOpen(false)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* 勞務類快篩：預設 ON（"all" = 顯示全部）*/}
        {onProcurementTypeChange && (
          <Button
            variant="outline"
            className={cn("gap-1.5", procurementType !== "all" && "border-primary/50 bg-primary/5 text-primary")}
            onClick={() => onProcurementTypeChange(procurementType === "all" ? "勞務類" : "all")}
            aria-label="勞務類篩選"
          >
            勞務類
          </Button>
        )}

        {/* 操作按鈕群組 */}
        {onRefresh && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="default" className="gap-2" onClick={onRefresh} disabled={isRefreshing}>
              {isRefreshing ? <span className="animate-spin text-sm">↻</span> : <RotateCcw className="size-3.5" />}
              手動更新
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-9" aria-label="更多操作">
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => setSendDialogOpen(true)}>
                  <Mail className="mr-2 size-3.5" />
                  立即發送報告
                </DropdownMenuItem>
                {onExport && (
                  <DropdownMenuItem onSelect={onExport}>
                    <Download className="mr-2 size-3.5" />
                    匯出 CSV
                  </DropdownMenuItem>
                )}
                {onReAnalyze && (
                  <DropdownMenuItem onSelect={onReAnalyze} disabled={isAnalyzing}>
                    <Sparkles className="mr-2 size-3.5" />
                    {isAnalyzing ? "AI 分析中..." : "AI 重新分析"}
                  </DropdownMenuItem>
                )}
                {onClearAll && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={onClearAll}
                      disabled={isClearing}
                      className={confirmClear ? "text-destructive focus:text-destructive" : ""}
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      {isClearing ? "刪除中..." : confirmClear ? "⚠️ 確認刪除？" : "一鍵刪除"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <SendReportDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} />

      {/* 篩選 chips + 筆數 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          顯示{" "}
          <span className="font-medium tabular-nums text-foreground">{filteredCount}</span>{" "}
          / {totalCount} 件
        </span>
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <Badge key={chip.label} variant="secondary" className="h-6 gap-1 pr-1 text-[11px] font-normal">
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
        )}
      </div>
    </div>
  )
}
