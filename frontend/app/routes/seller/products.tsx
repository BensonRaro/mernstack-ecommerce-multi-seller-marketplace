import { useState } from "react";
import { Link } from "react-router";
import { Package, Plus, Download, Trash2, Pencil, AlertCircle, FileJson } from "lucide-react";
import { DeleteProductDialog } from "@/components/product/delete-product-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { SearchInput } from "@/components/globals/search-input";
import { DataPagination } from "@/components/globals/data-pagination";
import { SellerRevocationBanner } from "@/components/seller/seller-revocation-banner";
import { useSellerProducts, useDeleteProduct } from "@/hooks/use-products";
import { useSellerMe } from "@/hooks/use-auth";
import { exportToCsv, exportToJson } from "@/lib/export";
import { categories } from "@/constants/categories";
import { toast } from "@/components/ui/toast";

const STATUSES = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function statusStyles(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400";
    case "archived":
      return "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400";
    case "draft":
    default:
      return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400";
  }
}

function formatPrice(price: number, discount: number) {
  if (discount > 0) {
    const discounted = price - (price * discount) / 100;
    return { original: price, discounted, hasDiscount: true };
  }
  return { original: price, discounted: price, hasDiscount: false };
}

export default function SellerProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const limit = 8;

  const { data: sellerData } = useSellerMe();
  const seller = sellerData?.seller;
  const isApproved = seller?.approved ?? false;
  const isRevoked = !isApproved && !!seller?.revokedAt;

  const [productToDelete, setProductToDelete] = useState<import("@/hooks/use-products").Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, isError, error, isFetching, refetch } = useSellerProducts({
    page,
    limit,
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
    mine: true,
  });

  const deleteProduct = useDeleteProduct();

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleCategoryChange(val: string) {
    setCategory(val);
    setPage(1);
  }

  function handleStatusChange(val: string) {
    setStatus(val);
    setPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setPage(1);
  }

  const hasActiveFilters = search || category !== "all" || status !== "all";

  function handleExportCsv() {
    if (!products.length) {
      toast.add({ type: "error", title: "No products to export" });
      return;
    }
    exportToCsv(products, `products-page-${page}`);
    toast.add({ type: "success", title: "CSV exported" });
  }

  function handleExportJson() {
    if (!products.length) {
      toast.add({ type: "error", title: "No products to export" });
      return;
    }
    exportToJson(products, `products-page-${page}`);
    toast.add({ type: "success", title: "JSON exported" });
  }

  async function handleExportFilteredCsv() {
    try {
      const res = await fetch(
        `http://localhost:5000/api/products?mine=true&limit=1000${search ? `&search=${encodeURIComponent(search)}` : ""}${category !== "all" ? `&category=${category}` : ""}${status !== "all" ? `&status=${status}` : ""}`,
        { credentials: "include" }
      );
      const json = (await res.json()) as { products: typeof products };
      if (!json.products?.length) {
        toast.add({ type: "error", title: "No products to export" });
        return;
      }
      exportToCsv(json.products, "products-filtered");
      toast.add({ type: "success", title: "CSV exported" });
    } catch {
      toast.add({ type: "error", title: "Export failed" });
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <SellerRevocationBanner
        approved={seller?.approved ?? false}
        revokedAt={seller?.revokedAt ?? null}
        revokedReason={seller?.revokedReason ?? null}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight">Products</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Manage your catalog
            </p>
            {!isLoading && (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tracking-wide text-muted-foreground">
                {total} {total === 1 ? "product" : "products"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" disabled={!products.length && !hasActiveFilters}>
                  <Download data-icon="inline-start" />
                  Export
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Export products</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleExportCsv}>
                  <Download />
                  Export page as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJson}>
                  <FileJson />
                  Export page as JSON
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleExportFilteredCsv}>
                  <Download />
                  Export filtered as CSV
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isApproved && (
            <Button size="sm" render={<Link to="/seller/products/create" />}>
              <Plus data-icon="inline-start" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-1 items-center gap-3">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search products, category..."
              className="w-full max-w-[360px]"
            />
            {isFetching && !isLoading && (
              <Spinner className="size-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={(v) => v !== null && handleCategoryChange(v)}>
              <SelectTrigger size="sm" className="h-9 min-w-[150px] rounded-full border border-border bg-muted/40 px-4 text-xs font-medium tracking-widest uppercase">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => v !== null && handleStatusChange(v)}>
              <SelectTrigger size="sm" className="h-9 min-w-[140px] rounded-full border border-border bg-muted/40 px-4 text-xs font-medium tracking-widest uppercase">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 rounded-full px-4 text-xs tracking-widest uppercase"
              >
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
            {category !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 ring-1 ring-border">
                {categories.find((c) => c.slug === category)?.name ?? category}
              </span>
            )}
            {status !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 ring-1 ring-border">
                {status}
              </span>
            )}
            <span className="ml-auto text-muted-foreground">
              {total} result{total !== 1 && "s"}
            </span>
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
            <p className="text-sm font-medium">Failed to load products</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {(error as Error)?.message || "Something went wrong. Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            {hasActiveFilters ? (
              <>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>
                  No products match your filters. Try adjusting search or clear filters.
                </EmptyDescription>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                </EmptyContent>
              </>
            ) : (
              <>
                <EmptyTitle>No products yet</EmptyTitle>
                <EmptyDescription>
                  Create your first product to start selling. Your catalog will appear here.
                </EmptyDescription>
                <EmptyContent>
                  {isApproved ? (
                    <Button size="sm" render={<Link to="/seller/products/create" />}>
                      <Plus data-icon="inline-start" />
                      Create product
                    </Button>
                  ) : isRevoked ? (
                    <p className="text-sm text-muted-foreground">
                      Your seller account has been revoked. You cannot create products.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your seller account is pending approval. You cannot create products yet.
                    </p>
                  )}
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
                    <TableHead className="w-[38%]">Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const priceInfo = formatPrice(product.price, product.discount);
                    return (
                      <TableRow key={product.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                              {product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <Package className="size-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium leading-tight">
                                {product.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {product.sizes.join(", ") || "—"} {product.gender ? `· ${product.gender}` : ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize tracking-wide">
                            {product.category.replace("-", " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold tracking-tight">
                              ${priceInfo.discounted.toFixed(2)}
                            </span>
                            {priceInfo.hasDiscount && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${priceInfo.original.toFixed(2)} · {product.discount}% off
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              product.stock === 0
                                ? "text-xs font-medium text-destructive"
                                : product.stock < 10
                                  ? "text-xs font-medium text-amber-600"
                                  : "text-xs text-muted-foreground"
                            }
                          >
                            {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase ring-1 ${statusStyles(product.status)}`}
                          >
                            <span className="mr-1.5 size-1.5 rounded-full bg-current" />
                            {product.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isApproved && (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-sm" className="size-7 rounded-full opacity-0 group-hover:opacity-100">
                                    <span className="sr-only">Actions</span>
                                    <Pencil className="size-3.5" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuGroup>
                                  <DropdownMenuItem render={<Link to={`/seller/products/${product.id}/edit`} />}>
                                    <Pencil />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => {
                                      setProductToDelete(product);
                                      setIsDeleteOpen(true);
                                    }}
                                  >
                                    <Trash2 />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

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

      <p className="text-xs text-muted-foreground">
        Tip: Use search and filters to narrow your catalog — then export the view as CSV or JSON.
      </p>

      <DeleteProductDialog
        product={productToDelete}
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setProductToDelete(null);
        }}
        isPending={deleteProduct.isPending}
        onConfirm={() => {
          if (!productToDelete) return;
          deleteProduct.mutate(productToDelete.id, {
            onSuccess: () => {
              toast.add({ type: "success", title: "Product deleted" });
              setIsDeleteOpen(false);
              setProductToDelete(null);
            },
            onError: (e) => toast.add({ type: "error", title: e.message }),
          });
        }}
      />
    </div>
  );
}
