import { Heart, Package, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import type { Product } from "@/hooks/use-products";

interface ProductCardProps {
  product: Product;
  className?: string;
}

function isNewProduct(createdAt: string) {
  const d = new Date(createdAt).getTime();
  const now = Date.now();
  return now - d < 7 * 24 * 60 * 60 * 1000;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const discounted = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const hasDiscount = product.discount > 0;
  const isNew = isNewProduct(product.createdAt);
  const outOfStock = product.stock === 0;

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const addToCart = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const isInCart = cartItems.some((i) => i.product.id === product.id);

  return (
    <article
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
        outOfStock && "opacity-90",
        className
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover/card:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <Package className="size-8 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur">
              {product.category.replace("-", " ")}
            </span>
            {hasDiscount && (
              <span className="inline-flex w-fit rounded-full bg-primary px-2 py-1 text-[10px] font-bold tracking-widest text-primary-foreground shadow-sm">
                -{product.discount}%
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {isNew && !hasDiscount && (
              <span className="inline-flex rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase text-background shadow-sm">
                New
              </span>
            )}
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWishlisted}
              onClick={(e) => {
                e.preventDefault();
                const added = toggleWishlist(product);
                toast.add({
                  type: added ? "success" : "info",
                  title: added ? "Added to wishlist" : "Removed from wishlist",
                  description: product.name,
                });
              }}
              className={cn(
                "flex size-8 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors",
                isWishlisted
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white/90 text-foreground hover:bg-white hover:text-primary"
              )}
            >
              <Heart className={cn("size-3.5", isWishlisted && "fill-primary-foreground")} />
            </button>
          </div>
        </div>

        {outOfStock && (
          <div className="absolute inset-x-3 bottom-3 rounded-full bg-foreground/90 px-3 py-1.5 text-center text-[11px] font-semibold tracking-widest uppercase text-background backdrop-blur">
            Out of stock
          </div>
        )}

        {!outOfStock && (
          <div className="absolute inset-x-3 bottom-3 flex opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const ok = addToCart(product, 1);
                if (!ok) {
                  toast.add({ type: "error", title: `Only ${product.stock} left`, description: product.name });
                } else {
                  toast.add({ type: "success", title: isInCart ? "Quantity updated" : "Added to cart", description: product.name });
                }
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold tracking-widest uppercase text-foreground shadow-md ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-foreground hover:text-background"
            >
              <ShoppingBag className="size-3.5" />
              {isInCart ? "Add more" : "Quick add"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c}
              className="size-3 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: c.startsWith("#") ? c : undefined }}
              title={c}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[11px] text-muted-foreground">+{product.colors.length - 4}</span>
          )}
          {product.seller ? (
            product.seller.username ? (
              <Link to={`/${product.seller.username}`} className="ml-auto truncate text-[11px] tracking-wide text-muted-foreground hover:text-foreground hover:underline">
                {product.seller.name}
              </Link>
            ) : (
              <span className="ml-auto truncate text-[11px] tracking-wide text-muted-foreground">{product.seller.name}</span>
            )
          ) : null}
        </div>

        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-foreground">
          <Link to={`/product/${product.id}`} className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center gap-1">
          <span className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3 ${i < Math.round(product.avgRating ?? 0) ? "fill-amber-500" : "fill-amber-500/15 text-amber-500/15"}`} />
            ))}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {(product.totalReviews ?? 0) > 0 ? `${(product.avgRating ?? 0).toFixed(1)} (${product.totalReviews})` : "No reviews"}
          </span>
          {(product.unitsSold ?? 0) > 0 && <span className="ml-auto text-[11px] text-muted-foreground">{product.unitsSold} sold</span>}
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
            ${discounted.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
