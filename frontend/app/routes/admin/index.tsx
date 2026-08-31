import { Link } from "react-router";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  DollarSign,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAdminStats, type AdminStats } from "@/hooks/use-admin-stats";

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

function StatCardsSkeleton() {
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

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatTick(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d}`;
}

function SalesChart({ data }: { data: AdminStats["salesOverTime"] }) {
  const hasRevenue = data.some((d) => d.revenue > 0);
  const totalPeriodRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalPeriodOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Platform sales</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Revenue last 30 days · daily
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--chart-1)]" />
              Revenue
            </span>
            <span className="text-muted-foreground">
              {totalPeriodOrders}{" "}
              {totalPeriodOrders === 1 ? "order" : "orders"} · $
              {totalPeriodRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasRevenue ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <p className="text-sm font-medium">No sales yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When sellers make sales, platform-wide revenue will appear here.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={{
              revenue: { label: "Revenue", color: "var(--chart-1)" },
            }}
            className="h-[280px] w-full"
          >
            <AreaChart
              data={data}
              margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
                tickFormatter={formatTick}
                tick={{ fontSize: 11 }}
                ticks={data
                  .filter((_, i) => i % 5 === 0)
                  .map((d) => d.date)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
                tick={{ fontSize: 11 }}
                width={56}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const raw = payload?.[0]?.payload
                        ?.date as string | undefined;
                      return raw ? formatDateLabel(raw) : "";
                    }}
                    formatter={(value) =>
                      `$${Number(value).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill="url(#fillRevenue)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Platform-wide revenue excludes cancelled orders.
        </p>
      </CardContent>
    </Card>
  );
}

function SalesChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

function PendingSellersCard({
  stats,
}: {
  stats: AdminStats | undefined;
}) {
  if (!stats) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Pending sellers</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Awaiting approval
          </p>
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <Clock className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        {stats.pendingSellers === 0 ? (
          <div className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <p className="text-sm font-medium">All caught up</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              No pending seller applications to review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {stats.pendingSellers}
              </span>{" "}
              {stats.pendingSellers === 1 ? "seller" : "sellers"} waiting for
              approval
            </p>
            <div className="space-y-2">
              {stats.recentPendingSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {seller.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {seller.user.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(seller.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/admin/sellers"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all sellers
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingSellersCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
        <Skeleton className="size-8 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, isError, error, refetch } = useAdminStats();

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="size-5 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of platform activity and management tools.
        </p>
      </div>

      {isLoading ? (
        <>
          <StatCardsSkeleton />
          <SalesChartSkeleton />
          <PendingSellersCardSkeleton />
        </>
      ) : isError ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="text-sm font-medium">Failed to load dashboard</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {(error as Error)?.message || "Something went wrong."}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={String(stats.totalUsers)}
              sub={`${stats.totalUsers === 1 ? "user" : "users"} registered`}
              icon={Users}
            />
            <StatCard
              title="Total Sellers"
              value={String(stats.totalSellers)}
              sub={`${stats.pendingSellers} pending approval`}
              icon={Store}
            />
            <StatCard
              title="Total Products"
              value={String(stats.totalProducts)}
              sub={`${stats.totalProducts === 1 ? "product" : "products"} listed`}
              icon={Package}
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`${stats.totalOrders} ${stats.totalOrders === 1 ? "order" : "orders"} completed`}
              icon={DollarSign}
            />
          </div>

          {/* Sales Chart */}
          <SalesChart data={stats.salesOverTime} />

          {/* Pending Sellers */}
          <PendingSellersCard stats={stats} />
        </>
      ) : null}
    </div>
  );
}
