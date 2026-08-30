import { Link } from "react-router";
import { ArrowRight, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { BestsellerCard } from "@/components/product/BestsellerCard";
import { useBestSellers } from "@/hooks/use-products";

function BestsellerSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
      <Skeleton className="w-[38%] shrink-0" />
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

export function BestSellers() {
  const { data, isLoading, isError, error, refetch } = useBestSellers(6);
  const bestSellers = data?.bestSellers ?? [];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary">
              <span className="h-px w-6 bg-primary" />
              Best Sellers
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">Most Loved by Customers</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Handpicked best sellers—proven favorites with the highest sales.
            </p>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-1.5 self-start text-sm font-medium hover:text-primary sm:self-auto"
          >
            View All Best Sellers
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BestsellerSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-14 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-5" />
              </span>
              <p className="text-sm font-medium">Failed to load best sellers</p>
              <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Please try again."}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
                Retry
              </Button>
            </div>
          ) : bestSellers.length === 0 ? (
            <Empty className="rounded-2xl border bg-card py-16">
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No best sellers yet</EmptyTitle>
              <EmptyDescription>Best sellers will appear once orders are placed.</EmptyDescription>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              {bestSellers.map(({ product, orders }, i) => (
                <BestsellerCard key={product.id} product={product} sales={orders} rank={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
