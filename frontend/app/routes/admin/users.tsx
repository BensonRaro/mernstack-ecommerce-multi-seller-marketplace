import { useState } from "react";
import {
  Users,
  Search,
  AlertCircle,
  Loader2,
  Calendar,
  Mail,
  Shield,
  Ban,
  UserCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { SearchInput } from "@/components/globals/search-input";
import { DataPagination } from "@/components/globals/data-pagination";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { useAdminUsers, useBanUser, type AdminUser } from "@/hooks/use-admin-users";
import { authClient } from "@/lib/auth-client";

type RoleFilter = "all" | "buyer" | "seller" | "admin";

function RoleBadge({ role, seller }: { role: string; seller: AdminUser["seller"] }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-purple-700 ring-1 ring-purple-500/20 dark:text-purple-400">
        <span className="size-1.5 rounded-full bg-purple-500" />
        Admin
      </span>
    );
  }
  if (role === "seller") {
    if (seller?.approved) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Seller
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Seller
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-400">
      <span className="size-1.5 rounded-full bg-blue-500" />
      Buyer
    </span>
  );
}

function StatusBadge({ banned }: { banned: boolean }) {
  if (banned) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-destructive ring-1 ring-destructive/20">
        <span className="size-1.5 rounded-full bg-destructive" />
        Banned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const limit = 10;

  const roleParam = filter === "all" ? "" : filter;

  const { data, isLoading, isError, error, refetch } = useAdminUsers({
    page,
    limit,
    search,
    role: roleParam,
  });

  const banUser = useBanUser();

  const { data: sessionData } = authClient.useSession();
  const currentUserId = sessionData?.session?.userId;

  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function handleFilterChange(value: string | null) {
    setFilter(value as RoleFilter);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleBanClick(user: AdminUser) {
    setBanTarget(user);
  }

  function closeBanDialog() {
    setBanTarget(null);
  }

  async function confirmBan() {
    if (!banTarget) return;
    try {
      await banUser.mutateAsync({ id: banTarget.id, banned: !banTarget.banned });
      toast.add({
        type: "success",
        title: banTarget.banned ? "User unbanned" : "User banned",
        description: banTarget.name || banTarget.email,
      });
      closeBanDialog();
    } catch {
      toast.add({
        type: "error",
        title: banTarget.banned ? "Failed to unban user" : "Failed to ban user",
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage buyers, sellers, and admin accounts.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} {total === 1 ? "user" : "users"}
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name or email…"
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="h-9 w-[160px] rounded-xl border border-border bg-card px-3 data-[size=default]:h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="buyer">Buyers</SelectItem>
                <SelectItem value="seller">Sellers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <UsersTableSkeleton />
        ) : isError ? (
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <p className="text-sm font-medium">Failed to load users</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {(error as Error)?.message || "Something went wrong."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
              Retry
            </Button>
          </CardContent>
        ) : users.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No users found</EmptyTitle>
            <EmptyDescription>
              {search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "No users have signed up yet."}
            </EmptyDescription>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarImage
                            src={user.image || undefined}
                            alt={user.name || user.email}
                          />
                          <AvatarFallback className="text-xs bg-muted">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-tight">
                            {user.name || "Unnamed"}
                          </p>
                          {user.seller && (
                            <p className="truncate text-xs text-muted-foreground">
                              @{user.seller.username || user.seller.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} seller={user.seller} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge banned={user.banned} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.id === currentUserId ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : user.banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBanClick(user)}
                            disabled={banUser.isPending}
                            className="rounded-full text-xs"
                          >
                            <UserCheck data-icon="inline-start" className="size-3.5" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBanClick(user)}
                            disabled={banUser.isPending}
                            className="rounded-full text-xs text-destructive hover:text-destructive"
                          >
                            <Ban data-icon="inline-start" className="size-3.5" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <DataPagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {/* Ban Confirmation Dialog */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeBanDialog}
          />
          <Card className="relative z-10 w-full max-w-md gap-0 border border-border p-0 shadow-xl">
            <CardContent className="space-y-4 p-6">
              <div
                className={`flex size-11 items-center justify-center rounded-full ${
                  banTarget.banned
                    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20"
                    : "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
                }`}
              >
                {banTarget.banned ? (
                  <UserCheck className="size-5" />
                ) : (
                  <Ban className="size-5" />
                )}
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  {banTarget.banned ? "Unban user?" : "Ban user?"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {banTarget.banned
                    ? `Unban "${banTarget.name || banTarget.email}"? They will regain access to the platform.`
                    : `This will ban "${banTarget.name || banTarget.email}". They will no longer be able to access the platform.`}
                </p>
                {banTarget.seller && !banTarget.banned && (
                  <p className="mt-2 text-xs text-destructive">
                    As a seller, their active products will also be archived.
                  </p>
                )}
                {banTarget.seller && banTarget.banned && (
                  <p className="mt-2 text-xs text-emerald-600">
                    As a seller, their archived products will be restored to active.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeBanDialog}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmBan}
                  disabled={banUser.isPending}
                  className={`rounded-full ${
                    banTarget.banned
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }`}
                >
                  {banUser.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : banTarget.banned ? (
                    "Unban"
                  ) : (
                    "Ban"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
