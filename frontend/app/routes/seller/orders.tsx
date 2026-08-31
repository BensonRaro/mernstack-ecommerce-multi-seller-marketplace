import { useState } from "react";
import { Link } from "react-router";
import { ShoppingBag, AlertCircle, Package, Truck, CreditCard, User as UserIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { SearchInput } from "@/components/globals/search-input";
import { DataPagination } from "@/components/globals/data-pagination";
import { useSellerOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { toast } from "@/components/ui/toast";

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function statusStyles(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400";
    case "shipped":
      return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400";
    case "delivered":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400";
    case "cancelled":
      return "bg-destructive/10 text-destructive ring-destructive/20";
    case "pending":
    default:
      return "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400";
  }
}

function paymentStyles(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20";
    case "failed":
      return "bg-destructive/10 text-destructive ring-destructive/20";
    default:
      return "bg-amber-500/10 text-amber-700 ring-amber-500/20";
  }
}

export default function SellerOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const limit = 8;

  const { data, isLoading, isError, error, isFetching, refetch } = useSellerOrders({
    page,
    limit,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const updateStatus = useUpdateOrderStatus();

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const hasActiveFilters = search || status !== "all";

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handleStatusChange(v: string) {
    setStatus(v);
    setPage(1);
  }
  function handleClear() {
    setSearch("");
    setStatus("all");
    setPage(1);
  }

  function handleStatusUpdate(orderId: string, newStatus: string) {
    updateStatus.mutate(
      { id: orderId, status: newStatus },
      {
        onSuccess: () => toast.add({ type: "success", title: `Order ${newStatus}` }),
        onError: (e) => toast.add({ type: "error", title: e.message }),
      }
    );
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            Orders
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Manage customer orders containing your products</p>
            {!isLoading && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tracking-wide text-muted-foreground">
                {total} {total === 1 ? "order" : "orders"}
              </span>
            )}
          </div>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-1 items-center gap-3">
            <SearchInput value={search} onChange={handleSearchChange} placeholder="Search order, phone, promo..." className="w-full max-w-[360px]" />
            {isFetching && !isLoading && <Spinner className="size-4 text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => v !== null && handleStatusChange(v)}>
              <SelectTrigger size="sm" className="h-9 min-w-[150px] rounded-full border border-border bg-muted/40 px-4 text-xs font-medium tracking-widest uppercase">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 rounded-full px-4 text-xs tracking-widest uppercase">
                Clear
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-2.5 text-xs">
            <span className="font-medium tracking-widest uppercase text-muted-foreground">Filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 ring-1 ring-border">
                search: <b className="font-semibold">"{search}"</b>
              </span>
            )}
            {status !== "all" && <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 ring-1 ring-border">{status}</span>}
            <span className="ml-auto text-muted-foreground">{total} result{total !== 1 && "s"}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <p className="text-sm font-medium">Failed to load orders</p>
            <p className="max-w-sm text-sm text-muted-foreground">{(error as Error)?.message || "Something went wrong."}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyMedia variant="icon">
              <ShoppingBag />
            </EmptyMedia>
            {hasActiveFilters ? (
              <>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>No orders match your filters.</EmptyDescription>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={handleClear} className="rounded-full">
                    Clear filters
                  </Button>
                </EmptyContent>
              </>
            ) : (
              <>
                <EmptyTitle>No orders yet</EmptyTitle>
                <EmptyDescription>Orders will appear here once customers purchase your products.</EmptyDescription>
                <EmptyContent>
                  <Button size="sm" className="rounded-full" render={<Link to="/seller/products" />}>
                    View products
                  </Button>
                </EmptyContent>
              </>
            )}
          </Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const isExpanded = expanded.has(order.id);
                    return (
                      <>
                        <TableRow key={order.id} className="group" data-expanded={isExpanded ? "" : undefined}>
                          <TableCell className="w-8">
                            <button
                              type="button"
                              aria-label={isExpanded ? "Collapse order" : "Expand order"}
                              aria-expanded={isExpanded}
                              onClick={() => toggleExpanded(order.id)}
                              className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-medium tracking-wide">#{order.id.slice(-8).toUpperCase()}</span>
                              <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">
                                {order.deliveryStatus === "delivery" ? <Truck className="size-3" /> : <Package className="size-3" />}
                                {order.deliveryStatus}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {order.user?.image ? (
                                <img src={order.user.image} alt={order.user.name || ""} className="size-7 rounded-full object-cover" />
                              ) : (
                                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs">
                                  <UserIcon className="size-3.5" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium leading-tight">{order.user?.name || "Guest"}</p>
                                <p className="truncate text-xs text-muted-foreground">{order.user?.email || order.phoneNumber || "—"}</p>
                                {order.phoneNumber && <p className="text-xs text-muted-foreground">{order.phoneNumber}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(order.id)}
                              className="flex items-center gap-2 text-left"
                            >
                              <div className="flex -space-x-2">
                                {order.items.slice(0, 3).map((it) => (
                                  <div key={it.id} className="size-8 overflow-hidden rounded-lg border border-border bg-muted">
                                    {it.product.images[0] ? (
                                      <img src={it.product.images[0]} alt={it.product.name} className="size-full object-cover" />
                                    ) : (
                                      <div className="flex size-full items-center justify-center">
                                        <Package className="size-3.5 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium">
                                  {order.items.length} item{order.items.length !== 1 && "s"} {order._allItemsCount && order._allItemsCount > order.items.length ? `· +${order._allItemsCount - order.items.length} other` : ""}
                                </span>
                                <span className="max-w-[160px] truncate text-xs text-muted-foreground">{order.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}</span>
                                <span className="text-xs font-medium text-primary">{isExpanded ? "Hide items" : order.items.length > 1 ? `View ${order.items.length} items` : "View item"}</span>
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">
                                sub ${order.subtotal.toFixed(2)} {order.discount > 0 && `· -${order.discount.toFixed(2)}`} {order.deliveryFee > 0 && `· ship $${order.deliveryFee.toFixed(2)}`}
                              </span>
                              {order.promoCode && <span className="text-xs text-emerald-600">promo {order.promoCode}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                                <CreditCard className="size-3" />
                                {order.paymentMethod}
                              </span>
                              <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-widest uppercase ring-1 ${paymentStyles(order.paymentStatus)}`}>
                                <span className="size-1.5 rounded-full bg-current" />
                                {order.paymentStatus}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase ring-1 ${statusStyles(order.status)}`}>
                              <span className="size-1.5 rounded-full bg-current" />
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-sm" className="size-7 rounded-full opacity-0 group-hover:opacity-100" disabled={updateStatus.isPending}>
                                    <span className="sr-only">Actions</span>
                                    <ShoppingBag className="size-3.5" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel>Update status</DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuGroup>
                                  {STATUS_OPTIONS.filter((s) => s.value !== "all").map((opt) => (
                                    <DropdownMenuItem
                                      key={opt.value}
                                      onClick={() => handleStatusUpdate(order.id, opt.value)}
                                      disabled={order.status === opt.value}
                                    >
                                      {opt.label}
                                      {order.status === opt.value && <span className="ml-auto text-xs text-muted-foreground">current</span>}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(order.id);
                                      toast.add({ type: "success", title: "Order ID copied" });
                                    }}
                                  >
                                    Copy order ID
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${order.id}-expanded`} className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={8} className="p-0">
                              <div className="bg-muted/30 p-4">
                                <div className="rounded-2xl border border-border bg-card p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-heading text-sm font-semibold tracking-wide">Order items · {order.items.length}</h4>
                                    <span className="text-xs text-muted-foreground">
                                      Placed {new Date(order.createdAt).toLocaleString()} • {order.deliveryStatus} • {order.paymentMethod}
                                    </span>
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {order.items.map((it) => (
                                      <div key={it.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                                        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                          {it.product.images[0] ? (
                                            <img src={it.product.images[0]} alt={it.product.name} className="size-full object-cover" />
                                          ) : (
                                            <div className="flex size-full items-center justify-center">
                                              <Package className="size-5 text-muted-foreground/50" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="line-clamp-1 text-sm font-medium leading-tight">{it.product.name}</p>
                                          <p className="text-xs text-muted-foreground">Quantity: {it.quantity}</p>
                                          <div className="mt-1 flex items-center gap-2">
                                            <span className="text-sm font-semibold">${it.price.toFixed(2)}</span>
                                            <span className="text-xs text-muted-foreground">× {it.quantity}</span>
                                            <span className="ml-auto text-sm font-semibold text-primary">${(it.price * it.quantity).toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {order.items.length > 4 && (
                                    <p className="mt-3 text-center text-xs text-muted-foreground">
                                      Showing {order.items.length} of {order.items.length} items in this order
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <DataPagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">Tip: Search by order ID, phone, or promo code. Update status to keep buyers informed.</p>
    </div>
  );
}
