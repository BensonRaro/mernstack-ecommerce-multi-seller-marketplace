import { useParams, Link } from "react-router";
import { Package, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { useProduct } from "@/hooks/use-products";

export default function ProductDetails() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useProduct(id);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-4 w-32" />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
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
          <EmptyTitle>Failed to load product</EmptyTitle>
          <EmptyDescription>{(error as Error)?.message || "Please try again."}</EmptyDescription>
          <EmptyContent>
            <Button size="sm" className="rounded-full" render={<Link to="/shop" />}>
              Back to shop
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  const product = data?.product;

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Empty className="border py-16">
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>Product not found</EmptyTitle>
          <EmptyDescription>The product you are looking for does not exist or was removed.</EmptyDescription>
          <EmptyContent>
            <Button size="sm" className="rounded-full" render={<Link to="/" />}>
              Back to home
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <ProductGallery images={product.images} name={product.name} />
          <ProductInfo product={product} />
        </div>

        <div className="mt-10">
          <ReviewsSection productId={product.id} />
        </div>
      </div>
    </main>
  );
}
