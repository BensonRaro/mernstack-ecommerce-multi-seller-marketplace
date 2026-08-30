import { Link } from "react-router";
import { ArrowRight, Package, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { BestsellerCard } from "@/components/product/BestsellerCard";
import type { BestSellerItem } from "@/hooks/use-seller-stats";

function SellerBestsellerSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
      <Skeleton className="w-[38%] shrink-0" />
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SellerBestSellers({ bestSellers }: { bestSellers: BestSellerItem[] | undefined }) {
  if (bestSellers === undefined) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SellerBestsellerSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-full bg-amber-400 text-amber-950">
              <Award className="size-4" />
            </span>
            Best Sellers
          </CardTitle>
          <CardDescription className="mt-1.5">Your top performing products by units sold</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" render={<Link to="/seller/products" />}>
          View all <ArrowRight className="size-3.5" data-icon="inline-end" />
        </Button>
      </CardHeader>
      <CardContent>
        {bestSellers.length === 0 ? (
          <Empty className="rounded-xl border border-dashed bg-muted/20 py-10">
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>No sales yet</EmptyTitle>
            <EmptyDescription>When products sell, your best sellers will appear here.</EmptyDescription>
            <EmptyContent>
              <Button size="sm" variant="outline" className="rounded-full" render={<Link to="/seller/products" />}>
                Manage products
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bestSellers.map((item, i) => (
              <BestsellerCard key={item.product.id} product={item.product} sales={item.orders} rank={i} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
