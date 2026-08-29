"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";
import { Package } from "lucide-react";

function discounted(p: { price: number; discount: number }) {
  return p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
}

export function OrderSummary({
  deliveryStatus,
  discount,
  sellerId,
  sellerName,
  onPlaceOrder,
  isPending,
  paymentMethod,
}: {
  deliveryStatus: "pickup" | "delivery";
  discount: number;
  sellerId?: string | null;
  sellerName?: string | null;
  onPlaceOrder: () => void;
  isPending: boolean;
  paymentMethod: string;
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, i) => sum + discounted(i.product) * i.quantity, 0);
  const deliveryFee = deliveryStatus === "delivery" ? 5 : 0;
  const sellerSubtotal = sellerId ? items.filter((i) => i.product.sellerId === sellerId).reduce((sum, i) => sum + discounted(i.product) * i.quantity, 0) : subtotal;
  const discountAmount = discount ? (sellerId ? sellerSubtotal : subtotal) * (discount / 100) : 0;
  const total = subtotal + deliveryFee - discountAmount;

  return (
    <div className="sticky top-20 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Order Summary</h3>
      <div className="mt-4 space-y-3">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex gap-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
              {product.images[0] ? <img src={product.images[0]} alt={product.name} className="size-full object-cover" /> : <span className="flex size-full items-center justify-center"><Package className="size-4 text-muted-foreground" /></span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">Qty {quantity}</p>
            </div>
            <span className="text-sm font-medium">${(discounted(product) * quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}</span></div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount {discount}%{sellerName ? ` · ${sellerName}` : ""}</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-heading text-base font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
      </div>
      <Button size="lg" className="mt-5 w-full rounded-full" onClick={onPlaceOrder} disabled={isPending || items.length === 0}>
        {isPending ? "Processing…" : paymentMethod === "stripe" ? "Pay with Stripe" : "Place Order"}
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">Secure checkout • 14-day returns</p>
    </div>
  );
}
