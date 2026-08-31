import { Link } from "react-router";
import { AlertCircle, ArrowRight, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SellerStatCards, SellerStatCardsSkeleton } from "@/components/seller/seller-stat-cards";
import { SellerSalesChart, SellerSalesChartSkeleton } from "@/components/seller/seller-sales-chart";
import { SellerBestSellers } from "@/components/seller/SellerBestSellers";
import { SellerRevocationBanner } from "@/components/seller/seller-revocation-banner";
import { useSellerStats } from "@/hooks/use-seller-stats";
import { useSellerMe } from "@/hooks/use-auth";

export default function SellerDashboard() {
  const { data, isLoading, isError, error, refetch } = useSellerStats();
  const { data: sellerMe } = useSellerMe();
  const seller = sellerMe?.seller;
  const isRevoked = !seller?.approved && !!seller?.revokedAt;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here&apos;s what&apos;s happening with {sellerMe?.seller?.name ?? "your store"}.
        </p>
      </div>

      <SellerRevocationBanner
        approved={seller?.approved ?? false}
        revokedAt={seller?.revokedAt ?? null}
        revokedReason={seller?.revokedReason ?? null}
      />

      {isLoading ? (
        <div className="space-y-6">
          <SellerStatCardsSkeleton />
          <SellerSalesChartSkeleton />
        </div>
      ) : isError && !isRevoked ? (
        <Card className="border-destructive/20 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <p className="text-sm font-medium">Failed to load dashboard</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {(error as Error)?.message || "Something went wrong. Please try again."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : seller?.approved ? (
        <>
          <SellerStatCards stats={data} />

          <SellerSalesChart data={data?.salesOverTime ?? []} />

          <SellerBestSellers bestSellers={data?.bestSellers} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Package className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Manage your catalog</p>
                    <p className="text-xs text-muted-foreground">Add or edit products</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" render={<Link to="/seller/products" />}>
                  Products <ArrowRight data-icon="inline-end" className="size-3.5" />
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Star className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Store rating</p>
                    <p className="text-xs text-muted-foreground">
                      {data?.avgRating ? `${data.avgRating.toFixed(1)} / 5 from ${data.totalReviews} reviews` : "No reviews yet"}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" render={<Link to="/seller/settings" />}>
                  Settings <ArrowRight data-icon="inline-end" className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
