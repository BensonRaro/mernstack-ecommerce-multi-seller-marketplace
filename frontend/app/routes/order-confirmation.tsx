import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, XCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useCartStore } from "@/stores/cart";

export default function OrderConfirmation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const clearCart = useCartStore((s) => s.clearCart);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: () => api.get<{ order: { id: string; status: string; paymentStatus: string; paymentMethod: string; total: number; subtotal: number; discount: number; deliveryFee: number; deliveryStatus: string; phoneNumber: string; addressSnapshot: unknown; promoCode: string | null; createdAt: string; items: { productId: string; quantity: number; price: number }[] } }>(`/api/orders/${id}`),
  });

  useEffect(() => {
    if (data?.order?.paymentStatus === "paid" || data?.order?.paymentMethod === "cod") {
      // keep cart cleared after stripe success is handled via redirect; for COD clear now
      if (data.order.paymentMethod === "cod") clearCart();
      if (sessionId) clearCart();
    }
  }, [data, sessionId, clearCart]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="h-32 rounded-2xl" />
      </main>
    );
  }
  if (isError || !data?.order) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <XCircle className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 font-heading text-xl font-semibold">Order not found</h1>
        <Button className="mt-6 rounded-full" render={<Link to="/shop" />}>Back to shop</Button>
      </main>
    );
  }

  const order = data.order;
  const isPaid = order.paymentStatus === "paid";
  const isPending = order.paymentStatus === "pending" && order.paymentMethod === "stripe";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="items-center text-center">
          <span className={`flex size-14 items-center justify-center rounded-full ${isPaid || order.paymentMethod === "cod" ? "bg-emerald-500/10 text-emerald-600" : isPending ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"}`}>
            {isPaid || order.paymentMethod === "cod" ? <CheckCircle className="size-7" /> : isPending ? <Clock className="size-7" /> : <XCircle className="size-7" />}
          </span>
          <CardTitle className="mt-2 text-center">
            {order.paymentMethod === "cod" ? "Order confirmed" : isPaid ? "Payment successful" : isPending ? "Payment pending" : "Payment failed"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Order #{order.id.slice(-6)} • {new Date(order.createdAt).toLocaleString()}</p>
          {sessionId && <p className="text-xs text-muted-foreground">Session {sessionId.slice(0, 12)}…</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted/40 p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="capitalize">{order.deliveryStatus}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize">{order.paymentMethod} • {order.paymentStatus}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{order.phoneNumber}</span></div>
            {order.promoCode && <div className="flex justify-between"><span className="text-muted-foreground">Promo</span><span>{order.promoCode}</span></div>}
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>${order.deliveryFee.toFixed(2)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-${order.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1 rounded-full" render={<Link to="/shop" />}>
              Continue shopping <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" className="flex-1 rounded-full" render={<Link to="/" />}>
              <Package data-icon="inline-start" /> Home
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Stripe webhook will update status to {isPaid ? "paid" : "pending"} → confirmed. COD stays pending until delivery.</p>
        </CardContent>
      </Card>
    </main>
  );
}
