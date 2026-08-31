import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck, Plus, AlertCircle, Phone, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { DeliveryToggle } from "@/components/checkout/DeliveryToggle";
import { PromoField } from "@/components/checkout/PromoField";
import { PaymentMethod } from "@/components/checkout/PaymentMethod";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCartStore } from "@/stores/cart";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useValidatePromo } from "@/hooks/use-promos";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [deliveryStatus, setDeliveryStatus] = useState<"pickup" | "delivery">("delivery");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoSellerId, setPromoSellerId] = useState<string | null>(null);
  const [promoSellerName, setPromoSellerName] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [pending, setPending] = useState(false);

  const validatePromo = useValidatePromo();

  const addresses = profile?.addresses ?? [];
  const phones = profile?.phones ?? [];
  const defaultAddress = profile?.defaultAddress;
  const defaultPhone = profile?.defaultPhone;

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? addresses[0]?.id ?? "");
  const [selectedPhoneId, setSelectedPhoneId] = useState(defaultPhone?.id ?? phones[0]?.id ?? "");

  useEffect(() => {
    if (!selectedAddressId && addresses[0]) setSelectedAddressId(addresses[0].id);
  }, [addresses, selectedAddressId]);
  useEffect(() => {
    if (!selectedPhoneId && phones[0]) setSelectedPhoneId(phones[0].id);
  }, [phones, selectedPhoneId]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0] ?? null;
  const selectedPhone = phones.find((p) => p.id === selectedPhoneId) ?? phones[0] ?? null;

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
    if (deliveryStatus === "delivery" && selectedAddress && (!selectedAddress.street?.trim() || !selectedAddress.city?.trim() || !selectedAddress.zip?.trim())) {
      toast.add({ type: "error", title: "Incomplete address", description: "Please update your address with city and zip code in your profile." });
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
        phone: selectedPhone?.number,
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
              <>
                {addresses.length === 0 ? (
                  <Card className="border-destructive/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base normal-case tracking-tight">
                        <AlertCircle className="size-4 text-destructive" />
                        No Delivery Address Saved
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">You need a delivery address to proceed with checkout.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate("/profile?tab=address")}
                      >
                        <Plus className="size-4 mr-2" /> Add Address in Profile
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Delivery Address</h3>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/profile?tab=address")}>
                        <Pencil className="size-3.5" /> Change
                      </Button>
                    </div>
                    {selectedAddress ? (
                      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MapPin className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedAddress.label}</span>
                            {selectedAddress.isDefault && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedAddress.street}</p>
                          <p className="text-xs text-muted-foreground">{selectedAddress.city} · {selectedAddress.zip} · {selectedAddress.country}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                        No address selected.
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Pickup</h3>
                <p className="mt-2 text-sm text-muted-foreground">Collect from our store at 124 Maple Street, Springfield, IL 62701. You'll be notified when ready.</p>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Phone Number</h3>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/profile?tab=phone")}>
                  <Pencil className="size-3.5" /> Change
                </Button>
              </div>
              {phones.length === 0 ? (
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base normal-case tracking-tight">
                      <AlertCircle className="size-4 text-destructive" />
                      No Phone Number Saved
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">You need a phone number to proceed with checkout.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate("/profile?tab=phone")}
                    >
                      <Plus className="size-4 mr-2" /> Add Phone in Profile
                    </Button>
                  </CardContent>
                </Card>
              ) : selectedPhone ? (
                <div className="flex items-center gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{selectedPhone.label}</span>
                      {selectedPhone.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Default</span>
                      )}
                    </div>
                    <p className="text-sm font-medium font-mono">{selectedPhone.number}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No phone selected.</p>
              )}
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
                Stripe will redirect to checkout. COD is pay on delivery/pickup. Seller promo codes (e.g. from your favourite seller) apply only to that seller's items; global codes apply to all.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}