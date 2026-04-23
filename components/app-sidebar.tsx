"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  Tags,
  Settings,
  Radar,
  BellRing,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  { title: "儀表板", href: "/", icon: LayoutDashboard },
  { title: "智能標案列表", href: "/tenders", icon: ListChecks },
]

const navStrategy = [
  { title: "關鍵字策略", href: "/keywords", icon: Tags },
  { title: "帳號權限管理", href: "/settings/users", icon: Users },
  { title: "系統設定與通知", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
            aria-hidden
          >
            <Radar className="size-5" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold tracking-tight">
              Tender AI
            </span>
            <span className="truncate text-xs text-muted-foreground">
              政府採購情報分析
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>情報中心</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>策略與設定</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navStrategy.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div
            className="flex size-2 shrink-0 rounded-full bg-success"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-medium text-success">連線正常</span>
          </div>
          <BellRing className="size-4 text-muted-foreground" aria-hidden />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
