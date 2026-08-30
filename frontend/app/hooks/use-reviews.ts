import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ReviewUser {
  id: string;
  name: string | null;
  image: string | null;
}
export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  comments: ReviewComment[];
}

export function useReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", productId],
    enabled: !!productId,
    queryFn: () => api.get<{ reviews: Review[]; avg: number; total: number }>(`/api/reviews/product/${productId}`),
  });
}

export function useCanReview(productId: string | undefined) {
  return useQuery({
    queryKey: ["can-review", productId],
    enabled: !!productId,
    queryFn: () => api.get<{ canReview: boolean; hasPurchased: boolean; hasReviewed: boolean; review: Review | null }>(`/api/reviews/can-review/${productId}`),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; rating: number; comment: string }) =>
      api.post<{ review: Review }>("/api/reviews", data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.productId] });
      qc.invalidateQueries({ queryKey: ["can-review", vars.productId] });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; rating?: number; comment?: string }) =>
      api.put<{ review: Review }>(`/api/reviews/${id}`, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["reviews", data.review.productId] });
      qc.invalidateQueries({ queryKey: ["can-review", data.review.productId] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/api/reviews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["can-review"] });
    },
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, comment }: { reviewId: string; comment: string }) =>
      api.post<{ comment: ReviewComment }>(`/api/reviews/${reviewId}/comments`, { comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.delete<{ success: boolean }>(`/api/reviews/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useUserReviews() {
  return useQuery({
    queryKey: ["user-reviews"],
    queryFn: () => api.get<{ reviews: Review[] }>("/api/user/reviews"),
  });
}
