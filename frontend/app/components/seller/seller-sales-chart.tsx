import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesPoint } from "@/hooks/use-seller-stats";

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatTick(dateStr: string) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d}`;
}

export function SellerSalesChart({ data }: { data: SalesPoint[] }) {
  const hasRevenue = data.some((d) => d.revenue > 0);
  const totalPeriodRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalPeriodOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Sales over time</CardTitle>
            <CardDescription>Revenue last 30 days · daily</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--chart-1)]" />
              Revenue
            </span>
            <span className="text-muted-foreground">
              {totalPeriodOrders} {totalPeriodOrders === 1 ? "order" : "orders"} · ${totalPeriodRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {!hasRevenue ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <p className="text-sm font-medium">No sales yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When you make sales, your daily revenue will appear here. Share your products to get your first order.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={{
              revenue: { label: "Revenue", color: "var(--chart-1)" },
            }}
            className="h-[280px] w-full"
          >
            <AreaChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
                tickFormatter={formatTick}
                tick={{ fontSize: 11 }}
                ticks={data.filter((_, i) => i % 5 === 0).map((d) => d.date)}
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
                      const raw = payload?.[0]?.payload?.date as string | undefined;
                      return raw ? formatDateLabel(raw) : "";
                    }}
                    formatter={(value) => `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
          Daily revenue excludes cancelled orders. Amounts reflect your seller share (price × quantity).
        </p>
      </CardContent>
    </Card>
  );
}

export function SellerSalesChartSkeleton() {
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
