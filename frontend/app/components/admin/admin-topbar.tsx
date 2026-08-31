import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AdminTopbar() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger />

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
