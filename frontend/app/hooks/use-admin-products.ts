import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount: number;
  category: string;
  images: string[];
  stock: number;
  sizes: string[];
  colors: string[];
  gender: string | null;
  status: string;
  rejectionReason: string | null;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name: string;
    username: string | null;
    approved: boolean;
  };
  avgRating: number;
  totalReviews: number;
}

export interface AdminProductsResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export function useAdminProducts(params: AdminProductsParams = {}) {
  const { page = 1, limit = 10, search = "", category = "", status = "" } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (status) qs.set("status", status);

  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: () => api.get<AdminProductsResponse>(`/api/admin/products?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch<{ product: AdminProduct }>(`/api/admin/products/${id}/status`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["seller-products"] });
      qc.invalidateQueries({ queryKey: ["new-arrivals"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
      qc.invalidateQueries({ queryKey: ["best-sellers"] });
    },
  });
}
