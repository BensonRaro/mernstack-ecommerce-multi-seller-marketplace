import { useState } from "react";
import {
  Package,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Store,
  Tag,
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
import { toast } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/constants/categories";
import {
  useAdminProducts,
  useUpdateProductStatus,
  type AdminProduct,
} from "@/hooks/use-admin-products";

type StatusFilter = "all" | "active" | "draft" | "archived" | "rejected";

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground ring-1 ring-border">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        Archived
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-destructive ring-1 ring-destructive/20">
        <span className="size-1.5 rounded-full bg-destructive" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
      <span className="size-1.5 rounded-full bg-amber-500" />
      Draft
    </span>
  );
}

function ProductsTableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const limit = 10;

  const statusParam = statusFilter === "all" ? "" : statusFilter;
  const categoryParam = categoryFilter === "all" ? "" : categoryFilter;

  const { data, isLoading, isError, error, refetch } = useAdminProducts({
    page,
    limit,
    search,
    category: categoryParam,
    status: statusParam,
  });

  const updateStatus = useUpdateProductStatus();

  const [actionTarget, setActionTarget] = useState<{
    product: AdminProduct;
    type: "approve" | "reject";
  } | null>(null);
  const [reason, setReason] = useState("");

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string | null) {
    setCategoryFilter(value ?? "all");
    setPage(1);
  }

  function handleStatusChange(value: string | null) {
    setStatusFilter((value as StatusFilter) ?? "all");
    setPage(1);
  }

  function handleAction(product: AdminProduct, type: "approve" | "reject") {
    setReason("");
    setActionTarget({ product, type });
  }

  function closeActionDialog() {
    setActionTarget(null);
    setReason("");
  }

  async function confirmAction() {
    if (!actionTarget) return;
    const { product, type } = actionTarget;
    const newStatus = type === "approve" ? "active" : "rejected";
    try {
      await updateStatus.mutateAsync({
        id: product.id,
        status: newStatus,
        reason: type === "reject" ? reason.trim() : undefined,
      });
      toast.add({
        type: "success",
        title: type === "approve" ? "Product approved" : "Product rejected",
        description: product.name,
      });
      closeActionDialog();
    } catch {
      toast.add({
        type: "error",
        title: type === "approve" ? "Failed to approve product" : "Failed to reject product",
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight flex items-center gap-2">
            <Package className="size-5 text-primary" />
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor and manage all products across the platform.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {total} {total === 1 ? "product" : "products"}
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name or description…"
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-9 w-[150px] rounded-xl border border-border bg-card px-3 data-[size=default]:h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl border border-border bg-card px-3 data-[size=default]:h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <ProductsTableSkeleton />
        ) : isError ? (
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <p className="text-sm font-medium">Failed to load products</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {(error as Error)?.message || "Something went wrong."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
              Retry
            </Button>
          </CardContent>
        ) : products.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No products have been listed yet."}
            </EmptyDescription>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Seller</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const effectivePrice =
                    product.discount > 0
                      ? product.price * (1 - product.discount / 100)
                      : product.price;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Package className="size-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight">
                              {product.name}
                            </p>
                            {product.discount > 0 && (
                              <p className="text-[11px] text-destructive">
                                {product.discount}% off
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Tag className="size-3" />
                          <span className="capitalize">
                            {product.category.replace("-", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          <span className="font-medium">
                            {formatPrice(effectivePrice)}
                          </span>
                          {product.discount > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span
                          className={`text-sm ${
                            product.stock === 0
                              ? "text-destructive"
                              : product.stock <= 5
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={product.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Store className="size-3" />
                          <span className="truncate max-w-[120px]">
                            {product.seller.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {product.status === "active" || product.status === "rejected" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(product, "reject")}
                              disabled={updateStatus.isPending}
                              className="rounded-full text-xs"
                            >
                              <XCircle data-icon="inline-start" className="size-3.5" />
                              Reject
                            </Button>
                          ) : null}
                          {product.status !== "active" ? (
                            <Button
                              size="sm"
                              onClick={() => handleAction(product, "approve")}
                              disabled={updateStatus.isPending}
                              className="rounded-full text-xs"
                            >
                              <CheckCircle2 data-icon="inline-start" className="size-3.5" />
                              Approve
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  {actionTarget.type === "approve" ? "Approve product?" : "Reject product?"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {actionTarget.type === "approve"
                    ? `Approve "${actionTarget.product.name}"? It will become visible on the storefront.`
                    : `Reject "${actionTarget.product.name}"? The seller will not be able to edit or delete this product.`}
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
                    placeholder="e.g. Policy violation, misleading description, inappropriate content..."
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
                    updateStatus.isPending ||
                    (actionTarget.type === "reject" && !reason.trim())
                  }
                  className={`rounded-full ${
                    actionTarget.type === "approve"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  }`}
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : actionTarget.type === "approve" ? (
                    "Approve"
                  ) : (
                    "Reject"
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
