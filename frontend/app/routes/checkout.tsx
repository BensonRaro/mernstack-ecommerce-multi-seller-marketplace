import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { DeliveryToggle } from "@/components/checkout/DeliveryToggle";
import { AddressSelector } from "@/components/checkout/AddressSelector";
import { PhoneSelector } from "@/components/checkout/PhoneSelector";
import { PromoField } from "@/components/checkout/PromoField";
import { PaymentMethod } from "@/components/checkout/PaymentMethod";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCartStore } from "@/stores/cart";
import { useAddressStore } from "@/stores/address";
import { usePhoneStore } from "@/stores/phone";
import { useValidatePromo } from "@/hooks/use-promos";
import { api } from "@/lib/api";

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [deliveryStatus, setDeliveryStatus] = useState<"pickup" | "delivery">("delivery");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoSellerId, setPromoSellerId] = useState<string | null>(null);
  const [promoSellerName, setPromoSellerName] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [pending, setPending] = useState(false);

  const validatePromo = useValidatePromo();

  const addresses = useAddressStore((s) => s.addresses);
  const selectedAddressId = useAddressStore((s) => s.selectedId);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];

  const phones = usePhoneStore((s) => s.phones);
  const selectedPhoneId = usePhoneStore((s) => s.selectedId);
  const selectedPhone = phones.find((p) => p.id === selectedPhoneId) ?? phones[0];

  const sellerIds = useMemo(() => [...new Set(items.map((i) => i.product.sellerId))], [items]);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add products before checking out.</p>
        <Button className="mt-6 rounded-full" render={<Link to="/shop" />}>
          Browse shop
        </Button>
      </main>
    );
  }

  async function handlePromo(code: string) {
    try {
      const res = await validatePromo.mutateAsync({ code, sellerIds });
      if (res.valid && res.promo) {
        setPromoCode(res.promo.code);
        setDiscount(res.promo.discountPercent);
        setPromoSellerId(res.promo.sellerId);
        setPromoSellerName(res.sellerName);
        toast.add({ type: "success", title: `Promo ${res.promo.code} applied`, description: res.sellerName ? `Discount from ${res.sellerName}` : `${res.promo.discountPercent}% off` });
        return { ok: true, discount: res.promo.discountPercent, message: "Applied" };
      }
      return { ok: false, discount: 0, message: "Invalid code" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid promo code";
      return { ok: false, discount: 0, message: msg.includes("Promo") ? msg : "Invalid or expired code" };
    }
  }

  function handleClearPromo() {
    setPromoCode("");
    setDiscount(0);
    setPromoSellerId(null);
    setPromoSellerName(null);
  }

  async function handlePlaceOrder() {
    if (deliveryStatus === "delivery" && !selectedAddress) {
      toast.add({ type: "error", title: "Select delivery address" });
      return;
    }
    if (!selectedPhone) {
      toast.add({ type: "error", title: "Select phone number" });
      return;
    }

    setPending(true);
    try {
      const payload = {
        deliveryStatus,
        address: deliveryStatus === "delivery" ? selectedAddress : null,
        phone: selectedPhone.number,
        promoCode: promoCode || undefined,
        paymentMethod,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      };

      const res = await api.post<{ order: { id: string }; url?: string; sessionId?: string }>("/api/orders", payload);

      if (paymentMethod === "stripe" && res.url) {
        window.location.href = res.url;
        return;
      }

      toast.add({ type: "success", title: "Order placed", description: `Order #${res.order.id.slice(-6)}` });
      clearCart();
      navigate(`/order-confirmation/${res.order.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      toast.add({ type: "error", title: msg });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to shop
        </Link>
        <div className="mt-4 flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" /> Secure checkout • Cash or Stripe • Seller promos
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-sm font-semibold tracking-wider uppercase">Delivery Status</h2>
              <div className="mt-4">
                <DeliveryToggle value={deliveryStatus} onChange={setDeliveryStatus} />
              </div>
            </div>

            {deliveryStatus === "delivery" ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <AddressSelector />
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Pickup</h3>
                <p className="mt-2 text-sm text-muted-foreground">Collect from our store at 124 Maple Street, Springfield, IL 62701. You’ll be notified when ready.</p>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <PhoneSelector />
            </div>

            <PromoField
              value={promoCode}
              discount={discount}
              sellerName={promoSellerName}
              isPending={validatePromo.isPending}
              onApply={handlePromo}
              onClear={handleClearPromo}
            />

            <div className="rounded-2xl border border-border bg-card p-5">
              <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />
            </div>
          </div>

          <div>
            <OrderSummary
              deliveryStatus={deliveryStatus}
              discount={discount}
              sellerId={promoSellerId}
              sellerName={promoSellerName}
              onPlaceOrder={handlePlaceOrder}
              isPending={pending}
              paymentMethod={paymentMethod}
            />
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Heads up</p>
              <p className="mt-1 leading-relaxed">
                Stripe will redirect to checkout. COD is pay on delivery/pickup. Seller promo codes (e.g. from your favourite seller) apply only to that seller’s items; global codes apply to all.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
