import { Outlet, redirect } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SellerSidebar } from "@/components/seller/seller-sidebar";
import { SellerTopbar } from "@/components/seller/seller-topbar";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

export async function clientLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) throw redirect("/login");
  if (session.user.role !== "seller") throw redirect("/");
  try {
    const { seller } = await api.get<{ seller: { approved: boolean } | null }>("/api/seller/me");
    if (seller && !seller.approved) {
      return { revoked: true };
    }
    return { revoked: false };
  } catch {
    return { revoked: false };
  }
}

export default function SellerLayout() {
  return (
    <SidebarProvider>
      <SellerSidebar />
      <SidebarInset>
        <SellerTopbar />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
