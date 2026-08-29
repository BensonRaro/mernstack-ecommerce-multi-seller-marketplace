import { Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function ReviewsPlaceholder() {
  return (
    <Card id="reviews" className="scroll-mt-8">
      <CardHeader>
        <CardTitle className="text-base normal-case tracking-tight">Details & Reviews</CardTitle>
        <CardDescription>Product information and customer feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="rounded-full bg-muted p-1">
            <TabsTrigger value="details" className="rounded-full data-[state=active]:bg-card">
              Details
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full data-[state=active]:bg-card">
              Reviews (0)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Carefully crafted with premium materials. Fit and fabric details are listed above. For sizing help, check the size guide. This
              section will expand with rich product storytelling, materials, and care instructions.
            </p>
          </TabsContent>
          <TabsContent value="reviews" className="pt-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <span className="flex gap-1 text-muted-foreground">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4" />
                ))}
              </span>
              <p className="font-heading text-sm font-semibold">No reviews yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Be the first to review this product. Your feedback helps others discover the perfect fit.
              </p>
              <Button size="sm" variant="outline" className="rounded-full mt-1" disabled>
                Write a review — coming soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
