import { Link } from "react-router";
import { ArrowRight, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { ProductCard } from "@/components/product/ProductCard";
import { useNewArrivals } from "@/hooks/use-products";

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="space-y-3 p-4">
        <div className="flex gap-1.5">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="size-3 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function NewArrivals() {
  const { data, isLoading, isError, error, refetch } = useNewArrivals(8);
  const products = data?.products ?? [];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary">
              <span className="h-px w-6 bg-primary" />
              New Arrivals
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Just Dropped — Trending Now
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Discover the latest products added by our sellers. Fresh, curated, and ready to shop.
            </p>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground transition-colors hover:text-primary sm:self-auto"
          >
            View All
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-14 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-5" />
              </span>
              <p className="text-sm font-medium">Failed to load new arrivals</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {(error as Error)?.message || "Please try again."}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <Empty className="rounded-2xl border border-border bg-card py-16">
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No new arrivals yet</EmptyTitle>
              <EmptyDescription>New products will appear here as soon as sellers add them.</EmptyDescription>
              <EmptyContent>
                <Button size="sm" className="rounded-full" render={<Link to="/shop" />}>
                  Browse categories
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
