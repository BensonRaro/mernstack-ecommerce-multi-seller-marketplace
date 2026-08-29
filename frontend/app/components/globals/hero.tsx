import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const trendingProducts = [
  {
    name: "Air Max 270",
    price: "$129.99",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
  },
  {
    name: "Smart Watch",
    price: "$99.99",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
  },
  {
    name: "Wireless Headphones",
    price: "$39.99",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
  },
  {
    name: "Water Bottle",
    price: "$24.99",
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop",
  },
];

const avatars = [
  "https://i.pravatar.cc/40?img=1",
  "https://i.pravatar.cc/40?img=2",
  "https://i.pravatar.cc/40?img=3",
  "https://i.pravatar.cc/40?img=4",
  "https://i.pravatar.cc/40?img=5",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[700px] items-center lg:grid-cols-2 lg:gap-8">
          {/* Left Content */}
          <div className="relative z-10 py-12 lg:py-0">
            <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase">
              Trending Now
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Discover Products
              <br />
              You&apos;ll Love
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground leading-relaxed">
              Shop the latest trending products curated for modern lifestyles.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="gap-2">
                Shop Now
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg">
                Explore Collection
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Customer ${i + 1}`}
                    className="size-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Loved by{" "}
                <span className="font-medium text-foreground">50,000+</span>{" "}
                customers worldwide
              </p>
            </div>
          </div>

          {/* Right Content — Floating Products */}
          <div className="relative hidden h-[600px] lg:block">
            {/* Abstract orange background shape */}
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-primary/10" />
            <div className="absolute left-[55%] top-[45%] h-[400px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-primary/20" />

            {/* Central image */}
            <div className="absolute left-1/2 top-1/2 h-[580px] w-[320px] -translate-x-1/2 -translate-y-1/2">
              <img
                src="/hero-image.png"
                alt="Featured product"
                className="size-full object-contain"
              />
            </div>

            {/* Floating Product Cards */}
            {trendingProducts.map((product, i) => (
              <div
                key={product.name}
                className={`absolute flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5 ${
                  i === 0
                    ? "right-0 top-12"
                    : i === 1
                      ? "right-2 top-52"
                      : i === 2
                        ? "left-0 top-1/2 -translate-y-1/2"
                        : "right-4 bottom-16"
                }`}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="size-12 rounded-xl object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {product.name}
                  </p>
                  <span className="text-xs font-semibold text-primary">
                    {product.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
