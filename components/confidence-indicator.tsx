import { cn } from "@/lib/utils"
import { confidenceLevel } from "@/lib/mock-data"

interface ConfidenceIndicatorProps {
  score: number
  className?: string
  variant?: "bar" | "badge"
  isAnalyzing?: boolean
}

export function ConfidenceIndicator({
  score,
  className,
  variant = "bar",
  isAnalyzing = false,
}: ConfidenceIndicatorProps) {
  const level = confidenceLevel(score)
  const palette = {
    high: {
      bar: "bg-success",
      track: "bg-success/15",
      text: "text-success",
      label: "高",
    },
    medium: {
      bar: "bg-warning",
      track: "bg-warning/15",
      text: "text-warning-foreground",
      label: "中",
    },
    low: {
      bar: "bg-muted-foreground/60",
      track: "bg-muted",
      text: "text-muted-foreground",
      label: "低",
    },
  }[level]

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-xs font-medium tabular-nums",
          className,
        )}
      >
        <span className={cn("size-1.5 rounded-full", palette.bar)} aria-hidden />
        <span>{score}%</span>
      </span>
    )
  }

  if (isAnalyzing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-shimmer bg-primary/20 rounded-full" />
        </div>
        <span className="text-[10px] text-muted-foreground animate-pulse">分析中...</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative h-1.5 w-20 overflow-hidden rounded-full",
          palette.track,
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", palette.bar)}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
          aria-hidden
        />
      </div>
      <span className="w-10 text-right text-xs font-medium tabular-nums">
        {score}%
      </span>
      <span className="sr-only">信心度：{palette.label}（{score}%）</span>
    </div>
  )
}
