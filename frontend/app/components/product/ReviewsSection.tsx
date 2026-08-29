"use client";

import { useState } from "react";
import { Star, Send, Pencil, Trash2, MessageCircle, Package, LogIn } from "lucide-react";
import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { useReviews, useCanReview, useCreateReview, useUpdateReview, useDeleteReview, useCreateComment, useDeleteComment } from "@/hooks/use-reviews";
import { cn } from "@/lib/utils";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={cn(i <= rating ? "fill-primary text-primary" : "text-muted-foreground/30")} />
      ))}
    </span>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-0.5"
          aria-label={`Rate ${i} stars`}
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              (hover ? i <= hover : i <= value) ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"
            )}
          />
        </button>
      ))}
    </span>
  );
}

export function ReviewsSection({ productId }: { productId: string }) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { data, isLoading, isError, error, refetch } = useReviews(productId);
  const { data: canData } = useCanReview(productId);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const reviews = data?.reviews ?? [];
  const avg = data?.avg ?? 0;
  const total = data?.total ?? 0;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const canReview = canData?.canReview;
  const hasReviewed = canData?.hasReviewed;
  const hasPurchased = canData?.hasPurchased;

  function handleCreate() {
    if (!comment.trim() || comment.trim().length < 10) {
      toast.add({ type: "error", title: "Comment must be at least 10 characters" });
      return;
    }
    createReview.mutate(
      { productId, rating, comment: comment.trim() },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: "Review added" });
          setComment("");
          setRating(5);
        },
        onError: (e) => toast.add({ type: "error", title: e.message }),
      }
    );
  }

  function handleUpdate(reviewId: string) {
    if (!editComment.trim() || editComment.trim().length < 10) {
      toast.add({ type: "error", title: "Comment must be at least 10 characters" });
      return;
    }
    updateReview.mutate(
      { id: reviewId, rating: editRating, comment: editComment.trim() },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: "Review updated" });
          setEditingReviewId(null);
        },
        onError: (e) => toast.add({ type: "error", title: e.message }),
      }
    );
  }

  return (
    <Card id="reviews" className="scroll-mt-8">
      <CardHeader>
        <CardTitle className="text-base normal-case tracking-tight">Details & Reviews</CardTitle>
        <CardDescription>Product information and verified customer feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reviews">
          <TabsList className="rounded-full bg-muted p-1">
            <TabsTrigger value="details" className="rounded-full data-[state=active]:bg-card">
              Details
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-full data-[state=active]:bg-card">
              Reviews ({total})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Carefully crafted with premium materials. Fit and fabric details are listed above. For sizing help, check the size guide. This
              section will expand with rich product storytelling, materials, and care instructions.
            </p>
          </TabsContent>
          <TabsContent value="reviews" className="pt-6 space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="font-heading text-3xl font-semibold">{avg.toFixed(1)}</span>
                <div>
                  <StarRating rating={Math.round(avg)} />
                  <p className="text-xs text-muted-foreground">{total} {total === 1 ? "review" : "reviews"} • Verified purchasers</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="size-4" />
                One review per buyer • Threaded comments
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border p-4">
                    <div className="flex gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <Empty className="border py-10">
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>Failed to load reviews</EmptyTitle>
                <EmptyDescription>{(error as Error)?.message || "Try again."}</EmptyDescription>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => refetch()}>
                  Retry
                </Button>
              </Empty>
            ) : (
              <>
                {!user ? (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <p className="text-sm text-muted-foreground">Please sign in to leave a review.</p>
                    <Button size="sm" className="rounded-full" render={<Link to="/login" />}>
                      <LogIn data-icon="inline-start" />
                      Sign in
                    </Button>
                  </div>
                ) : hasReviewed ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    You have already reviewed this product. You can edit or delete your review below. You can still comment on any review thread.
                  </div>
                ) : !hasPurchased ? (
                  <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    Only users who have purchased this product can leave a review. You can still join comment threads on existing reviews.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-heading text-sm font-semibold">Write a review</p>
                    <p className="text-xs text-muted-foreground">Rating + comment (one per product). Purchase verified.</p>
                    <div className="mt-3 flex items-center gap-2">
                      <StarSelector value={rating} onChange={setRating} />
                      <span className="text-sm text-muted-foreground">{rating}.0</span>
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience (at least 10 characters)..."
                      rows={3}
                      className="mt-3 min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                    />
                    <Button size="sm" className="mt-3 rounded-full" onClick={handleCreate} disabled={createReview.isPending || !comment.trim()}>
                      {createReview.isPending ? "Posting..." : "Post review"}
                    </Button>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                    <span className="flex gap-1 text-muted-foreground">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-4" />
                      ))}
                    </span>
                    <p className="font-heading text-sm font-semibold">No reviews yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">Be the first to review. Your feedback helps others.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const isOwn = user?.id === review.userId;
                      const isEditing = editingReviewId === review.id;
                      return (
                        <div key={review.id} className="rounded-2xl border border-border bg-card p-4">
                          <div className="flex gap-3">
                            {review.user.image ? (
                              <img src={review.user.image} alt={review.user.name || ""} className="size-9 rounded-full object-cover" />
                            ) : (
                              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                {review.user.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{review.user.name || "Anonymous"}</p>
                                <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                                {isOwn && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">You</span>}
                              </div>
                              {isEditing ? (
                                <div className="mt-2 space-y-2">
                                  <StarSelector value={editRating} onChange={setEditRating} />
                                  <textarea
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" className="rounded-full" onClick={() => handleUpdate(review.id)} disabled={updateReview.isPending}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditingReviewId(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="mt-1">
                                    <StarRating rating={review.rating} />
                                  </div>
                                  <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>
                                </>
                              )}
                            </div>
                            {isOwn && !isEditing && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="size-8 rounded-full"
                                  onClick={() => {
                                    setEditingReviewId(review.id);
                                    setEditRating(review.rating);
                                    setEditComment(review.comment);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="size-8 rounded-full text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    if (!confirm("Delete review?")) return;
                                    deleteReview.mutate(review.id, {
                                      onSuccess: () => toast.add({ type: "success", title: "Review deleted" }),
                                      onError: (e) => toast.add({ type: "error", title: e.message }),
                                    });
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          <Separator className="my-3" />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-muted-foreground">
                                Comments {review.comments.length > 0 ? `(${review.comments.length})` : ""}
                              </p>
                              {review.comments.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setShowComments((s) => ({ ...s, [review.id]: !s[review.id] }))}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {showComments[review.id] ? "Hide" : `Show ${review.comments.length} comments`}
                                </button>
                              )}
                            </div>

                            {(showComments[review.id] || review.comments.length <= 2) &&
                              review.comments.map((c) => (
                                <div key={c.id} className="flex gap-2 rounded-xl bg-muted/40 p-2.5">
                                  {c.user.image ? (
                                    <img src={c.user.image} alt={c.user.name || ""} className="size-6 rounded-full object-cover" />
                                  ) : (
                                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs">
                                      {c.user.name?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">{c.user.name || "Anonymous"}</span>
                                      <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                                      {user?.id === c.userId && (
                                        <button
                                          type="button"
                                          onClick={() => deleteComment.mutate(c.id, { onSuccess: () => toast.add({ type: "success", title: "Comment deleted" }) })}
                                          className="ml-auto text-xs text-destructive hover:underline"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm leading-relaxed">{c.comment}</p>
                                  </div>
                                </div>
                              ))}

                            {user ? (
                              <div className="flex gap-2">
                                <input
                                  value={commentInputs[review.id] || ""}
                                  onChange={(e) => setCommentInputs((s) => ({ ...s, [review.id]: e.target.value }))}
                                  placeholder="Add a comment..."
                                  className="h-9 flex-1 rounded-full border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      const text = (commentInputs[review.id] || "").trim();
                                      if (!text) return;
                                      createComment.mutate(
                                        { reviewId: review.id, comment: text },
                                        {
                                          onSuccess: () => {
                                            setCommentInputs((s) => ({ ...s, [review.id]: "" }));
                                            toast.add({ type: "success", title: "Comment added" });
                                          },
                                          onError: (err) => toast.add({ type: "error", title: err.message }),
                                        }
                                      );
                                    }
                                  }}
                                />
                                <Button
                                  size="icon-sm"
                                  className="size-9 rounded-full"
                                  disabled={!(commentInputs[review.id] || "").trim() || createComment.isPending}
                                  onClick={() => {
                                    const text = (commentInputs[review.id] || "").trim();
                                    if (!text) return;
                                    createComment.mutate(
                                      { reviewId: review.id, comment: text },
                                      {
                                        onSuccess: () => {
                                          setCommentInputs((s) => ({ ...s, [review.id]: "" }));
                                          toast.add({ type: "success", title: "Comment added" });
                                        },
                                        onError: (err) => toast.add({ type: "error", title: err.message }),
                                      }
                                    );
                                  }}
                                >
                                  <Send className="size-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                <Link to="/login" className="text-primary hover:underline">
                                  Sign in
                                </Link>{" "}
                                to comment.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
