import * as React from "react"
import {
  ArrowLeftRightIcon,
  ChartBarIcon,
  CircleHelpIcon,
  HouseIcon,
  Settings2Icon,
  StoreIcon,
  WalletIcon,
} from "lucide-react"

import { NavMain, type NavItem } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Only Fraud Analytics exists; the other links are placeholders so the admin nav reads true to life.
const general: NavItem[] = [
  { title: "Home", url: "#", icon: <HouseIcon /> },
  { title: "Transactions", url: "#", icon: <ArrowLeftRightIcon /> },
  { title: "Merchants", url: "#", icon: <StoreIcon /> },
  { title: "Payouts", url: "#", icon: <WalletIcon /> },
  {
    title: "Analytics",
    url: "#",
    icon: <ChartBarIcon />,
    items: [{ title: "Fraud Analytics", url: "#", isActive: true }],
  },
]

const secondary = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get help", url: "#", icon: <CircleHelpIcon /> },
]

const user = { name: "Ops team", email: "ops@example.com", initials: "OP" }

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href="#">
                <WalletIcon className="size-5!" />
                <span className="text-base font-semibold">Payments Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="General" items={general} />
        <NavSecondary items={secondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
