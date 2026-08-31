import { useState } from "react";
import { Star, SlidersHorizontal, X, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { SearchInput } from "@/components/globals/search-input";
import { DataPagination } from "@/components/globals/data-pagination";
import { ProductCard } from "@/components/product/ProductCard";
import { useShopProducts } from "@/hooks/use-products";
import { categories } from "@/constants/categories";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Top Rated" },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < rating ? "fill-amber-500" : "fill-muted stroke-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

export default function Shop() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const limit = 12;

  const hasActiveFilters = Boolean(category || rating || priceRange[0] !== 0 || priceRange[1] !== 2000 || search);

  const { data, isLoading, isFetching, isError, error, refetch } = useShopProducts({
    page,
    limit,
    search: search || undefined,
    category,
    minPrice: priceRange[0] !== 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] !== 2000 ? priceRange[1] : undefined,
    rating,
    sort,
    status: "active",
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  function handleCategoryChange(val: string, checked: boolean) {
    setCategory(checked ? val : undefined);
    setPage(1);
  }

  function handleRatingChange(val: string) {
    if (val === "all") setRating(undefined);
    else setRating(Number(val));
    setPage(1);
  }

  function handlePriceCommit(value: number[]) {
    setPriceRange([value[0], value[1]]);
    setPage(1);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleSortChange(val: string) {
    setSort(val);
    setPage(1);
  }

  function clearAll() {
    setCategory(undefined);
    setPriceRange([0, 2000]);
    setRating(undefined);
    setSearch("");
    setSort("newest");
    setPage(1);
  }

  const SidebarContent = (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">Category</h3>
        <div className="mt-4 space-y-3">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={category === c.slug} onCheckedChange={(v) => handleCategoryChange(c.slug, v as boolean)} />
              <span className={category === c.slug ? "font-medium text-foreground" : "text-muted-foreground"}>{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <h3 className="text-sm font-semibold tracking-tight">Price</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          ${priceRange[0].toFixed(2)} - ${priceRange[1].toFixed(2)}
        </p>
        <div className="mt-4 px-1">
          <Slider value={priceRange} min={0} max={2000} step={10} onValueChange={(v) => handlePriceCommit(v as number[])} />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>$0</span>
            <span>$2000</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div>
        <h3 className="text-sm font-semibold tracking-tight">Rating</h3>
        <RadioGroup value={rating ? String(rating) : "all"} onValueChange={handleRatingChange} className="mt-4 gap-3">
          <label className="flex items-center gap-2.5 text-sm">
            <RadioGroupItem value="all" />
            <span className="text-muted-foreground">All ratings</span>
          </label>
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex items-center gap-2.5 text-sm">
              <RadioGroupItem value={String(r)} />
              <RatingStars rating={r} />
              <span className="text-xs text-muted-foreground">& up</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearAll} className="w-full rounded-full">
          Clean All
        </Button>
      )}
    </div>
  );

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-base font-semibold tracking-tight">Filter Options</h2>
              <div className="mt-6">{SidebarContent}</div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{start}-{end}</span> of <span className="font-semibold text-foreground">{total}</span> results
                  {isFetching && !isLoading && <span className="ml-2 inline-block size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent align-middle" />}
                </p>

                <div className="flex items-center gap-3">
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger
                      render={
                        <Button variant="outline" size="sm" className="rounded-full lg:hidden">
                          <SlidersHorizontal className="size-4" />
                          Filters
                        </Button>
                      }
                    />
                    <SheetContent side="left" className="overflow-y-auto p-0">
                      <SheetHeader className="p-6 pb-0">
                        <SheetTitle>Filter Options</SheetTitle>
                      </SheetHeader>
                      <div className="p-6 pt-6">{SidebarContent}</div>
                    </SheetContent>
                  </Sheet>

                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs font-medium tracking-widest uppercase text-muted-foreground sm:block">Sort By:</span>
                    <Select value={sort} onValueChange={(v) => v !== null && handleSortChange(v)}>
                      <SelectTrigger size="sm" className="h-9 min-w-[160px] rounded-full border bg-card px-4 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <SearchInput value={search} onChange={handleSearchChange} placeholder="Search products, category..." className="max-w-[420px]" />

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Active Filter</span>
                  {category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                      {categories.find((c) => c.slug === category)?.name ?? category}
                      <button onClick={() => { setCategory(undefined); setPage(1); }} aria-label="Remove category filter" className="rounded-full p-0.5 hover:bg-white/20">
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                  {rating && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                      {rating}★ & up
                      <button onClick={() => { setRating(undefined); setPage(1); }} aria-label="Remove rating filter" className="rounded-full p-0.5 hover:bg-white/20">
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                  {(priceRange[0] !== 0 || priceRange[1] !== 2000) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                      Price: ${priceRange[0]} - ${priceRange[1]}
                      <button onClick={() => { setPriceRange([0, 2000]); setPage(1); }} aria-label="Remove price filter" className="rounded-full p-0.5 hover:bg-white/20">
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                  {search && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
                      “{search}”
                      <button onClick={() => { setSearch(""); setPage(1); }} aria-label="Remove search filter" className="rounded-full p-0.5 hover:bg-white/20">
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                  <button onClick={clearAll} className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground underline underline-offset-4">
                    Clean All
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
                      <Skeleton className="aspect-[4/5] w-full" />
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-14 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="size-5" />
                  </span>
                  <p className="text-sm font-medium">Failed to load products</p>
                  <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Please try again."}</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
                    Retry
                  </Button>
                </div>
              ) : products.length === 0 ? (
                <Empty className="rounded-2xl border bg-card py-16">
                  <EmptyMedia variant="icon">
                    <Package />
                  </EmptyMedia>
                  <EmptyTitle>No products found</EmptyTitle>
                  <EmptyDescription>Try adjusting your filters or search. Clear filters to see all products.</EmptyDescription>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearAll} className="mt-4 rounded-full">
                      Clear filters
                    </Button>
                  )}
                </Empty>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                  <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
                    <DataPagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
