import { NavLink } from "react-router";
import {
  Package,
  PlusCircle,
  ShoppingBag,
  Settings,
  Store,
  Tag,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useSellerMe } from "@/hooks/use-auth";

const navItems = [
  { to: "/seller", label: "Dashboard", icon: LayoutDashboard },
  { to: "/seller/products", label: "Products", icon: Package },
  { to: "/seller/products/create", label: "Create Product", icon: PlusCircle },
  { to: "/seller/promos", label: "Promo Codes", icon: Tag },
  { to: "/seller/orders", label: "Orders", icon: ShoppingBag },
  { to: "/seller/ai-insights", label: "AI Insights", icon: Sparkles },
  { to: "/seller/settings", label: "Settings", icon: Settings },
];

export function SellerSidebar() {
  const { data } = useSellerMe();
  const storeName = data?.seller?.name ?? "Seller Dashboard";

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Store className="size-5 text-sidebar-primary" />
          <span className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {storeName}
          </span>
        </div>
      </SidebarHeader>

      {/* <SidebarSeparator /> */}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <NavLink to={item.to} end={item.to === "/seller" || item.to === "/seller/products"}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/">
              <SidebarMenuButton tooltip="Back to Store">
                <Store />
                <span>Back to Store</span>
              </SidebarMenuButton>
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
