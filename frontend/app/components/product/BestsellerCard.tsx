import { Link } from "react-router";
import { Package, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { useCartStore } from "@/stores/cart";
import type { Product } from "@/hooks/use-products";

interface Props {
  product: Product;
  unitsSold?: number;
  rank?: number;
  className?: string;
}

export function BestsellerCard({ product, unitsSold, rank, className }: Props) {
  const discounted = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const hasDiscount = product.discount > 0;
  const addToCart = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const isInCart = cartItems.some((i) => i.product.id === product.id);
  const outOfStock = product.stock === 0;

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
        className
      )}
    >
      <Link to={`/product/${product.id}`} className="relative flex w-[38%] shrink-0 items-center justify-center bg-muted">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-8 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-amber-950 shadow-sm">
          Bestseller
        </span>
        {rank !== undefined && rank < 3 && (
          <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shadow-sm">
            #{rank + 1}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <Link to={`/product/${product.id}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[15px] font-semibold tracking-tight">${discounted.toFixed(2)}</span>
          {hasDiscount && <span className="text-xs text-muted-foreground line-through">${product.price.toFixed(2)}</span>}
        </div>

        <div className="flex items-center gap-1 text-amber-500">
          <Star className="size-3 fill-amber-500" />
          <Star className="size-3 fill-amber-500" />
          <Star className="size-3 fill-amber-500" />
          <Star className="size-3 fill-amber-500" />
          <Star className="size-3 fill-amber-500/30" />
          <span className="ml-1 text-[11px] text-muted-foreground">{unitsSold !== undefined ? `${unitsSold} sold` : product.category.replace("-", " ")}</span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description ? product.description.slice(0, 80) : "Premium quality product — loved by customers."}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              const ok = addToCart(product, 1);
              if (!ok) toast.add({ type: "error", title: `Only ${product.stock} left`, description: product.name });
              else toast.add({ type: "success", title: isInCart ? "Quantity updated" : "Added to cart", description: product.name });
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-widest uppercase shadow-sm ring-1 ring-foreground/10 transition-colors",
              outOfStock ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            <ShoppingBag className="size-3.5" />
            {outOfStock ? "Out of stock" : "Quick Add"}
          </button>
          {unitsSold !== undefined && unitsSold > 0 && (
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">{unitsSold} sales</span>
          )}
        </div>
      </div>
    </article>
  );
}
