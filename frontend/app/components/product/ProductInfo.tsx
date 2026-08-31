"use client";

import { useState } from "react";
import { Heart, ShoppingBag, Truck, ShieldCheck, Package, Minus, Plus, Store } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "@/components/ui/toast";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { cn } from "@/lib/utils";
import type { Product } from "@/hooks/use-products";

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes[0] ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  const discounted = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const hasDiscount = product.discount > 0;
  const outOfStock = product.stock === 0;
  const maxQty = product.stock || 99;

  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id));

  function handleAddToCart() {
    if (outOfStock) {
      toast.add({ type: "error", title: "Out of stock" });
      return;
    }
    const ok = addToCart(product, quantity);
    if (!ok) toast.add({ type: "error", title: `Only ${product.stock} left` });
    else toast.add({ type: "success", title: "Added to cart", description: `${product.name} × ${quantity}` });
  }

  function handleWishlist() {
    const added = toggleWishlist(product);
    toast.add({ type: added ? "success" : "info", title: added ? "Added to wishlist" : "Removed from wishlist", description: product.name });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link to={`/shop?category=${product.category}`} className="capitalize text-muted-foreground hover:text-foreground">
          {product.category.replace("-", " ")}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="truncate font-medium">{product.name}</span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full border border-border bg-card px-2.5 py-1 text-xs capitalize">
            {product.category.replace("-", " ")}
          </Badge>
          {product.gender && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs capitalize">
              <span className="size-2 rounded-full bg-foreground/40" />
              {product.gender}
            </span>
          )}
          <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${outOfStock ? "bg-destructive/10 text-destructive ring-destructive/20" : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20"}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </span>
        </div>
        <h1 className="mt-3 font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="flex gap-0.5 text-muted-foreground" aria-label="No reviews">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-sm text-muted-foreground/40">
                ★
              </span>
            ))}
          </span>
          <a href="#reviews" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            0 reviews
          </a>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Store className="size-3.5" />
            {product.seller?.name ?? "Unknown seller"}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="font-heading text-2xl font-semibold tracking-tight">${discounted.toFixed(2)}</span>
        {hasDiscount && (
          <>
            <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
            <span className="rounded-full bg-primary px-2 py-1 text-xs font-bold tracking-widest text-primary-foreground">-{product.discount}%</span>
          </>
        )}
      </div>

      {product.description && <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>}

      {product.sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Size</p>
            <span className="text-xs text-muted-foreground">Pick a size</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={cn(
                  "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors",
                  selectedSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/20"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.colors.length > 0 && (
        <div>
          <p className="text-sm font-medium">Color</p>
          <p className="mt-1 text-xs text-muted-foreground">Available colors</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={cn(
                  "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedColor === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/20"
                )}
                title={c}
              >
                <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: c.startsWith("#") ? c : undefined }} />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            type="button"
            aria-label="Decrease"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || outOfStock}
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <button
            type="button"
            aria-label="Increase"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={outOfStock || quantity >= maxQty}
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">Max {product.stock}</span>
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={isWishlisted}
          className={cn(
            "ml-auto flex size-10 items-center justify-center rounded-full border transition-colors",
            isWishlisted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
          )}
          aria-label="Wishlist"
        >
          <Heart className={cn("size-4", isWishlisted && "fill-primary-foreground")} />
        </button>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted"
          aria-label="Share"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.add({ type: "success", title: "Link copied" });
          }}
        >
          <Share2 className="size-4" />
        </button>
      </div>

      <div className="flex gap-3">
        <Button size="lg" className="flex-1 rounded-full" disabled={outOfStock} onClick={handleAddToCart}>
          <ShoppingBag data-icon="inline-start" />
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
        <Button size="lg" variant="outline" className="rounded-full" disabled={outOfStock} onClick={handleAddToCart}>
          Buy now
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <span className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
          <Truck className="size-4 text-primary" />
          Delivery in 2-4 days • $5
        </span>
        <span className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
          <ShieldCheck className="size-4 text-primary" />
          Secure payment • Returns 14d
        </span>
      </div>

      <Accordion className="rounded-2xl border border-border bg-card px-4">
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm font-medium">Product details</AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {product.description || "No additional details."} {product.seller?.name && `Sold by ${product.seller.name}.`}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping">
          <AccordionTrigger className="text-sm font-medium">Shipping & returns</AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            Free returns within 14 days. Ships from seller warehouse. Pickup also available at checkout.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function Share2(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
    </svg>
  );
}
