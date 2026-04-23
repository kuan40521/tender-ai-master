"use client"

import { Bell, Search } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTextSize, TextSize } from "@/components/providers/text-size-provider"
import { Type } from "lucide-react"

export function TopBar() {
  const { textSize, setTextSize } = useTextSize()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-5">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      <div className="flex w-full max-w-xl flex-1 items-center">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="搜尋標案、機關或關鍵字…"
            aria-label="全域搜尋"
          />
          <InputGroupAddon align="inline-end" className="hidden md:inline-flex">
            <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              /
            </kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="調整文字大小"
            >
              <Type className="size-[18px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>文字大小</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTextSize("default")}>
              預設 (100%) {textSize === "default" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTextSize("large")}>
              放大 (112.5%) {textSize === "large" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTextSize("xlarge")}>
              特大 (125%) {textSize === "xlarge" && "✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="通知"
        >
          <Bell className="size-[18px]" />
          <Badge
            className="absolute -right-0.5 -top-0.5 size-4 rounded-full p-0 text-[10px] tabular-nums"
            aria-hidden
          >
            3
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="系統管理員"
        >
          <span className="text-xs font-medium">系統管理員</span>
        </Button>
      </div>
    </header>
  )
}

