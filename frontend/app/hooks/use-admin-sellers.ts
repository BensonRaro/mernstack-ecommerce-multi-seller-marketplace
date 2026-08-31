import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminSeller {
  id: string;
  userId: string;
  username: string | null;
  name: string;
  image: string | null;
  description: string | null;
  approved: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: string;
  };
  _count: {
    products: number;
  };
}

export interface SellersResponse {
  sellers: AdminSeller[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SellersParams {
  page?: number;
  limit?: number;
  search?: string;
  approved?: boolean | null;
}

export function useAdminSellers(params: SellersParams = {}) {
  const { page = 1, limit = 10, search = "", approved = null } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (approved !== null) qs.set("approved", String(approved));

  return useQuery({
    queryKey: ["admin-sellers", params],
    queryFn: () => api.get<SellersResponse>(`/api/admin/sellers?${qs.toString()}`),
  });
}

export function useApproveSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ seller: AdminSeller }>(`/api/admin/sellers/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
    },
  });
}

export function useRejectSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch<{ seller: AdminSeller }>(`/api/admin/sellers/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
    },
  });
}

export function useBanSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      api.patch<{ success: boolean }>(`/api/admin/sellers/${id}/ban`, { banned }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
    },
  });
}
