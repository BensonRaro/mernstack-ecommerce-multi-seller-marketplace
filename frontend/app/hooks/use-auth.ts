import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSellerMe() {
  return useQuery({
    queryKey: ["seller-me"],
    queryFn: async () => {
      return api.get<{ seller: { id: string; name: string; username: string | null; approved: boolean; revokedAt: string | null; revokedReason: string | null; image: string | null; description: string | null } | null }>(
        "/api/seller/me"
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSeller() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      image: string;
      description: string;
      username: string;
    }) => {
      return api.post<{ seller: unknown }>("/api/seller", data);
    },
  });
}

export function useSellerByUsername(username: string | undefined) {
  return useQuery({
    queryKey: ["seller-profile", username],
    enabled: !!username,
    queryFn: async () => {
      return api.get<{
        seller: { id: string; name: string; username: string; image: string | null; description: string | null; approved: boolean; revokedAt: string | null; revokedReason: string | null; createdAt: string; user: { id: string; name: string | null; image: string | null } };
        products: import("@/hooks/use-products").Product[];
        reviews: Array<{ id: string; rating: number; comment: string; createdAt: string; user: { id: string; name: string | null; image: string | null }; product: { id: string; name: string; images: string[] } }>;
        avgRating: number;
        totalReviews: number;
        productCount: number;
      }>(`/api/seller/by-username/${username}`);
    },
  });
}

export function useCheckUsername(username: string) {
  return useQuery({
    queryKey: ["check-username", username],
    enabled: username.length >= 3,
    queryFn: async () => api.get<{ available: boolean; reason?: string }>(`/api/seller/check-username/${username}`),
  });
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: async (fileKey: string) => {
      return api.delete<{ success: boolean }>("/api/files", { fileKey });
    },
  });
}

export function useUpdateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; image: string | null; description: string | null; username?: string }) => {
      return api.patch<{ seller: { id: string; name: string; username: string | null; image: string | null; description: string | null; approved: boolean } }>(
        "/api/seller/me",
        data
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-me"] });
    },
  });
}
