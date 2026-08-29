"use client";

import { Heart, Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
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
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/toast";

function discounted(product: { price: number; discount: number }) {
  return product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;
}

interface WishlistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WishlistDrawer({ open, onOpenChange }: WishlistDrawerProps) {
  const isMobile = useIsMobile();
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.addItem);
  const swipeDirection = isMobile ? "down" : "right";

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={swipeDirection}
      showSwipeHandle={isMobile}
    >
      <DrawerContent className="bg-card border shadow-xl [--drawer-inset:16px] [--drawer-bleed-background:transparent] data-[swipe-axis=y]:h-[min(78vh,620px)] data-[swipe-axis=y]:max-h-[calc(100dvh-32px)] data-[swipe-axis=y]:w-[calc(100vw-32px)] data-[swipe-axis=y]:max-w-[480px] data-[swipe-axis=y]:mx-auto data-[swipe-axis=x]:[--drawer-content-width:420px] data-[swipe-axis=x]:max-w-[calc(100vw-32px)] data-[swipe-axis=x]:h-[calc(100dvh-32px)] !rounded-[20px] overflow-hidden">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2 text-[15px]">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Heart className="size-3.5 fill-primary" />
                </span>
                Wishlist
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-xs">
                {items.length > 0
                  ? "Save your favourites for later."
                  : "Your wishlist is empty."}
              </DrawerDescription>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clear();
                  toast.add({ type: "success", title: "Wishlist cleared" });
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
                <Heart className="size-5" />
              </span>
              <p className="font-heading text-sm font-semibold tracking-wider uppercase">
                No favourites yet
              </p>
              <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                Tap the heart on any product to save it here.
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
              {items.map((product) => {
                const price = discounted(product);
                return (
                  <li
                    key={product.id}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/40"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="line-clamp-1 text-sm font-medium leading-tight">
                        {product.name}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {product.category.replace("-", " ")}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm font-semibold">
                          ${price.toFixed(2)}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-xs line-through text-muted-foreground">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <button
                        type="button"
                        aria-label="Remove from wishlist"
                        onClick={() => {
                          remove(product.id);
                          toast.add({
                            type: "info",
                            title: `${product.name} removed`,
                          });
                        }}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      <Button
                        size="xs"
                        className="rounded-full px-3 text-[11px]"
                        disabled={product.stock === 0}
                        onClick={() => {
                          if (product.stock === 0) {
                            toast.add({ type: "error", title: "Out of stock" });
                            return;
                          }
                          const ok = addToCart(product, 1);
                          if (!ok)
                            toast.add({
                              type: "error",
                              title: `Only ${product.stock} left`,
                            });
                          else {
                            toast.add({
                              type: "success",
                              title: "Added to cart",
                            });
                          }
                        }}
                      >
                        <ShoppingBag data-icon="inline-start" />
                        {product.stock === 0 ? "Sold out" : "Add"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter className="border-t border-border bg-card">
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full mt-2"
              onClick={() => {
                items.forEach((p) => {
                  if (p.stock !== 0) addToCart(p, 1);
                });
                toast.add({ type: "success", title: "Moved all to cart" });
              }}
            >
              Move all to cart
            </Button>
            <DrawerClose
              render={<Button size="lg" className="w-full rounded-full" />}
            >
              Continue shopping
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
