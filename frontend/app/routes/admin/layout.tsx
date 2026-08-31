import { Outlet, redirect } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { authClient } from "@/lib/auth-client";

export async function clientLoader() {
  const { data: session } = await authClient.getSession();
  if (!session) throw redirect("/login");
  if (session.user.role !== "admin") throw redirect("/");
  return null;
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminTopbar />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
