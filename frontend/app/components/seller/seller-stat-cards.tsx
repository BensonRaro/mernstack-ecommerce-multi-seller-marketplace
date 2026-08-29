import { Package, ShoppingBag, DollarSign, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SellerStats } from "@/hooks/use-seller-stats";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="gap-0 py-5 shadow-sm transition-colors hover:bg-muted/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground">
          {title}
        </CardTitle>
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-heading text-[1.65rem] font-semibold leading-none tracking-tight">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export function SellerStatCards({ stats }: { stats: SellerStats | undefined }) {
  if (!stats) return null;

  const revenue = `$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rating = stats.avgRating ? stats.avgRating.toFixed(1) : "—";
  const ratingSub = stats.totalReviews ? `${stats.totalReviews} ${stats.totalReviews === 1 ? "review" : "reviews"}` : "No reviews yet";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Products" value={String(stats.totalProducts)} sub={`${stats.totalProducts === 1 ? "product" : "products"} in catalog`} icon={Package} />
      <StatCard title="Total Orders" value={String(stats.totalOrders)} sub={`${stats.totalOrders === 1 ? "order" : "orders"} received`} icon={ShoppingBag} />
      <StatCard title="Total Revenue" value={revenue} sub="Excluding cancelled orders" icon={DollarSign} />
      <StatCard title="Average Rating" value={rating} sub={ratingSub} icon={Star} />
    </div>
  );
}

export function SellerStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-0 py-5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="size-8 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
