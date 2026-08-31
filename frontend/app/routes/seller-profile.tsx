import { useParams, Link, data as routerData } from "react-router";
import { Store, Star, Package, Calendar, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProductCard } from "@/components/product/ProductCard";
import { useSellerByUsername } from "@/hooks/use-auth";

const RESERVED_USERNAMES = new Set([
  "shop",
  "seller",
  "checkout",
  "product",
  "products",
  "login",
  "signup",
  "admin",
  "api",
  "s",
  "u",
  "cart",
  "wishlist",
  "order-confirmation",
  "orders",
  "settings",
  "promos",
]);

export async function clientLoader({ params }: { params: { username?: string } }) {
  const username = params.username?.toLowerCase();
  if (username && RESERVED_USERNAMES.has(username)) {
    throw routerData(null, { status: 404, statusText: "Not Found" });
  }
  return null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-4 ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/20"}`} />
      ))}
    </span>
  );
}

export default function SellerProfile() {
  const { username } = useParams();
  const { data, isLoading, isError, error } = useSellerByUsername(username);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Empty className="border py-16">
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Seller not found</EmptyTitle>
          <EmptyDescription>{(error as Error)?.message || `No seller with username "${username}"`}</EmptyDescription>
          <EmptyContent>
            <Button size="sm" className="rounded-full" render={<Link to="/" />}>
              Back to home
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  const seller = data?.seller;
  const products = data?.products ?? [];
  const reviews = data?.reviews ?? [];
  const avgRating = data?.avgRating ?? 0;
  const totalReviews = data?.totalReviews ?? 0;
  const productCount = data?.productCount ?? 0;

  if (!seller) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <Empty className="border py-16">
          <EmptyMedia variant="icon">
            <Store />
          </EmptyMedia>
          <EmptyTitle>Seller not found</EmptyTitle>
        </Empty>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
          <CardContent className="pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="size-20 -mt-10 border-4 border-card shadow-sm">
                <AvatarImage src={seller.image || undefined} alt={seller.name} className="object-cover" />
                <AvatarFallback className="text-xl font-semibold bg-muted">{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">{seller.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tracking-wide text-muted-foreground">
                    @{seller.username}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-widest uppercase ring-1 ${
                      seller.approved
                        ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20"
                        : seller.revokedAt
                        ? "bg-destructive/10 text-destructive ring-destructive/20"
                        : "bg-amber-500/10 text-amber-700 ring-amber-500/20"
                    }`}
                  >
                    {seller.approved ? (
                      <CheckCircle2 className="size-3" />
                    ) : seller.revokedAt ? (
                      <XCircle className="size-3" />
                    ) : (
                      <Clock className="size-3" />
                    )}
                    {seller.approved ? "Verified seller" : seller.revokedAt ? "Revoked" : "Pending approval"}
                  </span>
                </div>
                {seller.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{seller.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
                    <StarRating rating={avgRating} />
                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({totalReviews} reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
                    <Package className="size-3.5" />
                    {productCount} products
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Joined {new Date(seller.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" render={<Link to="/" />}>
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>

        {!seller.approved && seller.revokedAt && (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
            role="status"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <XCircle className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading text-sm font-semibold tracking-tight text-destructive">
                This store is currently unavailable
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                The seller&apos;s products are not available for purchase at this time.
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="products" className="mt-6">
          <TabsList className="rounded-full bg-muted p-1">
            <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-card">
              Products ({productCount})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full data-[state=active]:bg-card">
              Reviews ({totalReviews})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {products.length === 0 ? (
              <Empty className="rounded-2xl border py-12">
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>No products yet</EmptyTitle>
                <EmptyDescription>{seller.name} hasn’t listed any active products.</EmptyDescription>
              </Empty>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p as never} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base normal-case tracking-tight">
                  <Star className="size-4 text-primary" />
                  Average rating
                  <span className="ml-2 font-heading text-lg font-bold">{avgRating.toFixed(1)}</span>
                  <StarRating rating={avgRating} />
                  <span className="text-sm font-normal text-muted-foreground">({totalReviews})</span>
                </CardTitle>
                <Separator className="mt-3" />
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length === 0 ? (
                  <Empty className="border-0 py-8">
                    <EmptyMedia variant="icon">
                      <Star />
                    </EmptyMedia>
                    <EmptyTitle>No reviews yet</EmptyTitle>
                    <EmptyDescription>When buyers review {seller.name}’s products, they’ll appear here.</EmptyDescription>
                  </Empty>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={r.user.image || undefined} alt={r.user.name || ""} />
                          <AvatarFallback className="text-xs">{r.user.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{r.user.name || "Anonymous"}</p>
                            <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <StarRating rating={r.rating} />
                          <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>
                          <div className="mt-2 flex items-center gap-2">
                            {r.product.images[0] && <img src={r.product.images[0]} alt={r.product.name} className="size-8 rounded-lg object-cover border" />}
                            <Link to={`/product/${r.product.id}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                              {r.product.name}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
