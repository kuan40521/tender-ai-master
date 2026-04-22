"use client"

import { Bell, Search, User, LogOut } from "lucide-react"

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
import { useSession, signOut } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { useTextSize, TextSize } from "@/components/providers/text-size-provider"
import { Type } from "lucide-react"

export function TopBar() {
  const { textSize, setTextSize } = useTextSize()
  const { data: session } = useSession()

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 px-2"
              aria-label="使用者選單"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {session?.user?.name?.[0] || <User className="size-3.5" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">
                {session?.user?.name || "未登入"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">{session?.user?.name || "訪客"}</span>
                <span className="text-xs font-normal text-muted-foreground text-wrap">
                  {session?.user?.email || "guest@example.com"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              個人資料
            </DropdownMenuItem>
            <DropdownMenuItem>偏好設定</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 size-4" />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

