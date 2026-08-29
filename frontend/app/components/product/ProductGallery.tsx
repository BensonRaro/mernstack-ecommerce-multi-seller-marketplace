import { useState } from "react";
import { Package, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const safeImages = images?.length ? images : [];

  if (safeImages.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Package className="size-8" />
          <span className="text-sm">No images</span>
        </div>
      </div>
    );
  }

  const prev = () => setActive((p) => (p === 0 ? safeImages.length - 1 : p - 1));
  const next = () => setActive((p) => (p === safeImages.length - 1 ? 0 : p + 1));

  return (
    <div className="flex gap-4">
      <div className="hidden flex-col gap-3 sm:flex">
        {safeImages.map((src, idx) => (
          <button
            key={src + idx}
            type="button"
            onClick={() => setActive(idx)}
            className={cn(
              "size-20 overflow-hidden rounded-xl border bg-card transition-all",
              active === idx ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/20"
            )}
            aria-label={`View image ${idx + 1}`}
            aria-pressed={active === idx}
          >
            <img src={src} alt={`${name} thumb ${idx + 1}`} className="size-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      <div className="relative flex-1">
        <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5">
          <img
            src={safeImages[active]}
            alt={name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow ring-1 ring-black/5 backdrop-blur">
              {active + 1} / {safeImages.length}
            </span>
            <span className="hidden rounded-full bg-white/90 p-1.5 shadow ring-1 ring-black/5 backdrop-blur sm:inline-flex">
              <Expand className="size-4 text-muted-foreground" />
            </span>
          </div>
          {safeImages.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon-sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow backdrop-blur hover:bg-white"
                onClick={prev}
                aria-label="Previous image"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow backdrop-blur hover:bg-white"
                onClick={next}
                aria-label="Next image"
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden">
          {safeImages.map((src, idx) => (
            <button
              key={src + idx}
              type="button"
              onClick={() => setActive(idx)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-card",
                active === idx ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <img src={src} alt={`${name} thumb ${idx + 1}`} className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
