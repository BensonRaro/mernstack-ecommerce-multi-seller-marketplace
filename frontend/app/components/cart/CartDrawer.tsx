"use client";

import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useCartStore } from "@/stores/cart";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/toast";

function discounted(product: { price: number; discount: number }) {
  return product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const isMobile = useIsMobile();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + discounted(i.product) * i.quantity, 0);

  const swipeDirection = isMobile ? "down" : "right";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection={swipeDirection} showSwipeHandle={isMobile}>
      <DrawerContent
        className="bg-card border shadow-xl [--drawer-inset:16px] [--drawer-bleed-background:transparent] data-[swipe-axis=y]:h-[min(78vh,620px)] data-[swipe-axis=y]:max-h-[calc(100dvh-32px)] data-[swipe-axis=y]:w-[calc(100vw-32px)] data-[swipe-axis=y]:max-w-[480px] data-[swipe-axis=y]:mx-auto data-[swipe-axis=x]:[--drawer-content-width:420px] data-[swipe-axis=x]:max-w-[calc(100vw-32px)] data-[swipe-axis=x]:h-[calc(100dvh-32px)] !rounded-[20px] overflow-hidden"
      >
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2 text-[15px]">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ShoppingBag className="size-3.5" />
                </span>
                Shopping Cart
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-xs">
                {count > 0 ? "Review your items before checkout." : "Your cart is empty."}
              </DrawerDescription>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  toast.add({ type: "success", title: "Cart cleared" });
                }}
                className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-5" />
              </span>
              <p className="font-heading text-sm font-semibold tracking-wider uppercase">Your cart is empty</p>
              <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                Add products from New Arrivals. Your selections will appear here.
              </p>
              <Button
                size="sm"
                className="mt-2 rounded-full"
                render={<Link to="/shop" onClick={() => onOpenChange(false)} />}
              >
                Browse shop <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(({ product, quantity }) => {
                const price = discounted(product);
                return (
                  <li
                    key={product.id}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="line-clamp-1 text-sm font-medium leading-tight">{product.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{product.category.replace("-", " ")}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-heading text-sm font-semibold">${price.toFixed(2)}</span>
                        {product.discount > 0 && (
                          <span className="text-xs line-through text-muted-foreground">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => {
                          removeItem(product.id);
                          toast.add({ type: "info", title: `${product.name} removed` });
                        }}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1 py-1">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => {
                            const ok = updateQuantity(product.id, quantity - 1);
                            if (!ok) toast.add({ type: "error", title: "Cannot update quantity" });
                          }}
                          className="flex size-6 items-center justify-center rounded-full hover:bg-muted"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">{quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => {
                            const ok = updateQuantity(product.id, quantity + 1);
                            if (!ok)
                              toast.add({
                                type: "error",
                                title: `Only ${product.stock} left`,
                              });
                          }}
                          className="flex size-6 items-center justify-center rounded-full hover:bg-muted"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter className="border-t border-border bg-card">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-heading text-lg font-semibold">${total.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full rounded-full" render={<Link to="/checkout" onClick={() => onOpenChange(false)} />}>
              Checkout <ArrowRight data-icon="inline-end" />
            </Button>
            <DrawerClose
              render={
                <Button variant="outline" size="lg" className="w-full rounded-full" />
              }
            >
              Continue shopping
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
