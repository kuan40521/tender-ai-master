"use client"

import {
  Building2,
  Calendar,
  CalendarClock,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FileText,
  Sparkles,
  Star,
  Tag,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConfidenceIndicator } from "@/components/confidence-indicator"
import {
  type Tender,
  daysUntil,
  formatBudget,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface TenderDetailSheetProps {
  tender: Tender | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleFavorite: (id: string) => void
  onToggleIgnore: (id: string) => void
}

export function TenderDetailSheet({
  tender,
  open,
  onOpenChange,
  onToggleFavorite,
  onToggleIgnore,
}: TenderDetailSheetProps) {
  if (!tender) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl" />
      </Sheet>
    )
  }

  const remaining = daysUntil(tender.dueDate || tender.deadline)
  const isFavorited = tender.status === "favorited"
  const isIgnored = tender.status === "ignored"

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(tender.url || tender.sourceUrl)
      toast.success("已複製公告連結到剪貼簿")
    } catch {
      toast.error("複製失敗，請手動複製")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="gap-2 border-b border-border p-6 pb-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden />
            <span>{tender.agency}</span>
            <span aria-hidden>•</span>
            <span className="font-mono tabular-nums">{tender.id}</span>
          </div>
          <SheetTitle className="text-pretty text-lg leading-snug">
            {tender.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            標案詳細資訊與 AI 推薦理由
          </SheetDescription>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {tender.tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="h-6 gap-1 px-2 text-xs font-normal"
              >
                <Tag className="size-3" aria-hidden />
                {t}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto p-6">
          {/* AI confidence block */}
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Sparkles className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">AI 推薦信心度</span>
                  <span className="text-xs text-muted-foreground">
                    基於標案內容語義分析
                  </span>
                </div>
              </div>
              <ConfidenceIndicator score={tender.confidence} />
            </div>
            <Separator className="my-3" />
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className="mr-1.5 font-medium">分析理由：</span>
              {tender.reason || tender.aiReason || "系統已自動基於關鍵字與標題進行潛力分類"}
            </p>
          </div>

          {/* Meta grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <MetaRow
              icon={CircleDollarSign}
              label="預算金額"
              value={
                <span className="font-medium tabular-nums">
                  NT$ {formatBudget(tender.budget)}
                </span>
              }
            />
            <MetaRow
              icon={FileText}
              label="招標方式"
              value={tender.biddingType || "公開招標 (依內文為主)"}
            />
            <MetaRow
              icon={Tag}
              label="採購方式"
              value={tender.procurementType || "依政府採購網公告"}
            />
            <MetaRow
              icon={Calendar}
              label="公告日期"
              value={
                <span className="tabular-nums">{tender.releaseDate || tender.publishDate}</span>
              }
            />
            <MetaRow
              icon={CalendarClock}
              label="截止日期"
              value={
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">{tender.dueDate || tender.deadline}</span>
                  <Badge
                    className={cn(
                      "h-5 px-1.5 text-[11px]",
                      remaining <= 3
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                        : remaining <= 7
                          ? "bg-warning/20 text-warning-foreground hover:bg-warning/20"
                          : "bg-muted text-muted-foreground hover:bg-muted",
                    )}
                    variant="secondary"
                  >
                    剩 {Math.max(0, remaining)} 天
                  </Badge>
                </div>
              }
            />
          </dl>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              快速操作
            </span>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <a
                  href={tender.url || tender.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="size-3.5" />
                  前往 PCC 公告
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={copyLink}
              >
                <Copy className="size-3.5" />
                複製連結
              </Button>
              <Button
                variant={isFavorited ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5",
                  isFavorited &&
                    "bg-warning text-warning-foreground hover:bg-warning/90",
                )}
                onClick={() => onToggleFavorite(tender.id)}
              >
                <Star
                  className={cn("size-3.5", isFavorited && "fill-current")}
                />
                {isFavorited ? "已收藏" : "加入收藏"}
              </Button>
              <Button
                variant={isIgnored ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5",
                  isIgnored &&
                    "bg-muted-foreground text-background hover:bg-muted-foreground/90",
                )}
                onClick={() => onToggleIgnore(tender.id)}
              >
                <XCircle className="size-3.5" />
                {isIgnored ? "已忽略" : "標記忽略"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  )
}
