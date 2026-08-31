import { useState } from "react";
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  Mail,
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { SearchInput } from "@/components/globals/search-input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminSellers,
  useApproveSeller,
  useRejectSeller,
  type AdminSeller,
} from "@/hooks/use-admin-sellers";

type ApprovalFilter = "all" | "approved" | "pending" | "revoked";

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, "ellipsis", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
  }
  return pages;
}

function StatusBadge({
  approved,
  revokedAt,
}: {
  approved: boolean;
  revokedAt: string | null;
}) {
  if (approved) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Approved
      </span>
    );
  }
  if (revokedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-destructive ring-1 ring-destructive/20">
        <span className="size-1.5 rounded-full bg-destructive" />
        Revoked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
      <span className="size-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

function SellersTableSkeleton() {
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
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function AdminSellers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ApprovalFilter>("all");
  const limit = 10;

  // "approved" filter uses approved=true; everything else passes no filter,
  // and we filter the (already server-paginated) results client-side for
  // "all", "pending", and "revoked" to keep the logic simple.
  const apiApproved: boolean | null = filter === "approved" ? true : null;

  const { data, isLoading, isError, error, refetch } = useAdminSellers({
    page,
    limit: 50,
    search,
    approved: apiApproved,
  });

  const approveSeller = useApproveSeller();
  const rejectSeller = useRejectSeller();

  const [actionTarget, setActionTarget] = useState<{
    seller: AdminSeller;
    type: "approve" | "reject";
  } | null>(null);
  const [reason, setReason] = useState("");

  const allSellers = data?.sellers ?? [];
  const filteredSellers =
    filter === "all"
      ? allSellers
      : filter === "approved"
      ? allSellers.filter((s) => s.approved)
      : filter === "pending"
      ? allSellers.filter((s) => !s.approved && !s.revokedAt)
      : allSellers.filter((s) => !s.approved && !!s.revokedAt);

  const total = filteredSellers.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const sellers = filteredSellers.slice((page - 1) * limit, page * limit);
  const pageNumbers = getPageNumbers(page, totalPages);

  function handleFilterChange(value: string | null) {
    setFilter(value as ApprovalFilter);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleAction(seller: AdminSeller, type: "approve" | "reject") {
    setReason("");
    setActionTarget({ seller, type });
  }

  function closeActionDialog() {
    setActionTarget(null);
    setReason("");
  }

  async function confirmAction() {
    if (!actionTarget) return;
    const { seller, type } = actionTarget;
    try {
      if (type === "approve") {
        await approveSeller.mutateAsync(seller.id);
        toast.add({ type: "success", title: "Seller approved", description: seller.name });
      } else {
        if (!reason.trim()) {
          toast.add({ type: "error", title: "Please provide a reason" });
          return;
        }
        await rejectSeller.mutateAsync({ id: seller.id, reason: reason.trim() });
        toast.add({ type: "success", title: "Seller revoked", description: seller.name });
      }
      closeActionDialog();
    } catch (e) {
      toast.add({
        type: "error",
        title: type === "approve" ? "Failed to approve seller" : "Failed to revoke seller",
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight flex items-center gap-2">
            <Store className="size-5 text-primary" />
            Sellers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve seller applications.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} {total === 1 ? "seller" : "sellers"}
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, username, or email…"
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="h-9 w-[160px] rounded-xl border border-border bg-card px-3 data-[size=default]:h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sellers</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <SellersTableSkeleton />
        ) : isError ? (
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <p className="text-sm font-medium">Failed to load sellers</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {(error as Error)?.message || "Something went wrong."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
              Retry
            </Button>
          </CardContent>
        ) : sellers.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No sellers found</EmptyTitle>
            <EmptyDescription>
              {search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "No sellers have signed up yet."}
            </EmptyDescription>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Seller</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-44 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarImage
                            src={seller.image || seller.user.image || undefined}
                            alt={seller.name}
                          />
                          <AvatarFallback className="text-xs bg-muted">
                            {seller.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-tight">
                            {seller.name}
                          </p>
                          {seller.username && (
                            <p className="truncate text-xs text-muted-foreground">
                              @{seller.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        <span className="truncate max-w-[200px]">
                          {seller.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Package className="size-3.5 text-muted-foreground" />
                        <span>{seller._count.products}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge approved={seller.approved} revokedAt={seller.revokedAt} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(seller.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {seller.approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(seller, "reject")}
                            disabled={rejectSeller.isPending}
                            className="rounded-full text-xs"
                          >
                            <XCircle data-icon="inline-start" className="size-3.5" />
                            Revoke
                          </Button>
                        ) : seller.revokedAt ? (
                          <Button
                            size="sm"
                            onClick={() => handleAction(seller, "approve")}
                            disabled={approveSeller.isPending}
                            className="rounded-full text-xs"
                          >
                            <CheckCircle2 data-icon="inline-start" className="size-3.5" />
                            Re-approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAction(seller, "approve")}
                            disabled={approveSeller.isPending}
                            className="rounded-full text-xs"
                          >
                            <CheckCircle2 data-icon="inline-start" className="size-3.5" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        aria-disabled={page === 1}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {pageNumbers.map((p, idx) =>
                      p === "ellipsis" ? (
                        <PaginationItem key={`e-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(p);
                            }}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        aria-disabled={page === totalPages}
                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Confirm Action Dialog */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeActionDialog}
          />
          <Card className="relative z-10 w-full max-w-md gap-0 border border-border p-0 shadow-xl">
            <CardContent className="space-y-4 p-6">
              <div
                className={`flex size-11 items-center justify-center rounded-full ${
                  actionTarget.type === "approve"
                    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20"
                    : "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
                }`}
              >
                {actionTarget.type === "approve" ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <XCircle className="size-5" />
                )}
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  {actionTarget.type === "approve"
                    ? actionTarget.seller.approved || actionTarget.seller.revokedAt
                      ? "Re-approve seller?"
                      : "Approve seller?"
                    : "Revoke seller?"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {actionTarget.type === "approve"
                    ? `Re-approve "${actionTarget.seller.name}" to start selling on the platform again. They will regain access to the seller dashboard.`
                    : `This will revoke approval for "${actionTarget.seller.name}". All their products will be archived. They will no longer be able to create, edit, or delete products.`}
                </p>
              </div>
              {actionTarget.type === "reject" && (
                <div className="space-y-1.5">
                  <Label htmlFor="reject-reason" className="text-xs font-medium">
                    Reason (required)
                  </Label>
                  <Textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Policy violation, spam, inappropriate content..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {reason.length}/500 characters
                  </p>
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeActionDialog}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmAction}
                  disabled={
                    approveSeller.isPending ||
                    rejectSeller.isPending ||
                    (actionTarget.type === "reject" && !reason.trim())
                  }
                  className={`rounded-full ${
                    actionTarget.type === "approve"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }`}
                >
                  {approveSeller.isPending || rejectSeller.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : actionTarget.type === "approve" ? (
                    actionTarget.seller.approved || actionTarget.seller.revokedAt ? (
                      "Re-approve"
                    ) : (
                      "Approve"
                    )
                  ) : (
                    "Revoke"
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
