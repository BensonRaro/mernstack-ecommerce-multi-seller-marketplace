import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Promo {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  sellerId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useSellerPromos() {
  return useQuery({
    queryKey: ["seller-promos"],
    queryFn: () => api.get<{ promos: Promo[] }>("/api/promos/mine"),
  });
}

export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; discountPercent: number; active?: boolean; expiresAt?: string | null }) =>
      api.post<{ promo: Promo }>("/api/promos", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-promos"] }),
  });
}

export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; code?: string; discountPercent?: number; active?: boolean; expiresAt?: string | null }) =>
      api.put<{ promo: Promo }>(`/api/promos/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-promos"] }),
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/api/promos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-promos"] }),
  });
}

export function useValidatePromo() {
  return useMutation({
    mutationFn: (data: { code: string; sellerIds?: string[] }) =>
      api.post<{ valid: boolean; promo: Promo; sellerName: string | null }>("/api/promos/validate", data),
  });
}
