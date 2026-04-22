"use client"

import { MoreHorizontal, Star, XCircle, ExternalLink, Eye } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfidenceIndicator } from "@/components/confidence-indicator"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  type Tender,
  daysUntil,
  formatBudget,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface TendersTableProps {
  tenders: Tender[]
  onView: (t: Tender) => void
  onToggleFavorite: (id: string) => void
  onToggleIgnore: (id: string) => void
}

export function TendersTable({
  tenders,
  onView,
  onToggleFavorite,
  onToggleIgnore,
}: TendersTableProps) {
  if (tenders.length === 0) {
    return (
      <Empty className="my-8">
        <EmptyHeader>
          <EmptyTitle>找不到符合條件的標案</EmptyTitle>
          <EmptyDescription>
            試著調整信心度區間、清除關鍵字或切換狀態篩選。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[30%] min-w-[260px]">標案名稱 / 機關</TableHead>
            <TableHead className="min-w-[110px]">預算</TableHead>
            <TableHead className="min-w-[150px]">招標 / 採購方式</TableHead>
            <TableHead className="min-w-[120px]">截止日期</TableHead>
            <TableHead className="min-w-[180px]">AI 信心度</TableHead>
            <TableHead className="w-10 text-right sr-only">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((t) => {
            const remaining = daysUntil(t.dueDate || t.deadline)
            const isFavorited = t.status === "favorited"
            const isIgnored = t.status === "ignored"

            return (
              <TableRow
                key={t.id}
                onClick={() => onView(t)}
                className={cn(
                  "group cursor-pointer align-top",
                  isIgnored && "opacity-60",
                )}
              >
                <TableCell className="py-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      {isFavorited ? (
                        <Star
                          className="mt-1 size-4 shrink-0 fill-warning text-warning"
                          aria-label="已收藏"
                        />
                      ) : null}
                      <span className="whitespace-normal text-base font-semibold leading-relaxed group-hover:text-primary">
                        {t.title}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {t.agency}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-4 text-base font-semibold tabular-nums">
                  {formatBudget(t.budget)}
                </TableCell>

                <TableCell className="py-3.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span>{t.biddingType || "未知方式"}</span>
                    <span className="text-muted-foreground">
                      {t.procurementType || "未知分類"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {t.dueDate || t.deadline}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 w-fit px-1.5 text-[11px] font-medium tabular-nums",
                        remaining <= 3
                          ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                          : remaining <= 7
                            ? "bg-warning/20 text-warning-foreground hover:bg-warning/20"
                            : "bg-muted text-muted-foreground hover:bg-muted",
                      )}
                    >
                      剩 {Math.max(0, remaining)} 天
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="py-3.5">
                  <ConfidenceIndicator 
                    score={t.confidence} 
                    isAnalyzing={t.confidence === 0 && t.reason === "AI 分析中..."}
                  />
                </TableCell>

                <TableCell
                  className="py-3.5 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="更多操作"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => onView(t)}>
                        <Eye className="mr-2 size-3.5" />
                        查看詳情
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={t.url || t.sourceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          <ExternalLink className="mr-2 size-3.5" />
                          前往 PCC 公告
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onToggleFavorite(t.id)}
                      >
                        <Star className="mr-2 size-3.5" />
                        {isFavorited ? "取消收藏" : "加入收藏"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onToggleIgnore(t.id)}>
                        <XCircle className="mr-2 size-3.5" />
                        {isIgnored ? "取消忽略" : "標記忽略"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
