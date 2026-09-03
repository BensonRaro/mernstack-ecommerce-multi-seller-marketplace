import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Product {
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
  seller: { id: string; name: string; image: string | null; username: string | null };
  avgRating?: number;
  totalReviews?: number;
  unitsSold?: number;
}

interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  discount?: number;
  category: string;
  images: string[];
  stock: number;
  sizes: string[];
  colors: string[];
  gender?: string | null;
  status: string;
}

export interface ProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  mine?: boolean;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      return api.post<{ product: Product }>("/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["new-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });
}

export function useSellerProducts(params: ProductsParams = {}) {
  const { page = 1, limit = 10, search, category, status, mine, sellerId } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (search) queryParams.set("search", search);
  if (category) queryParams.set("category", category);
  if (status) queryParams.set("status", status);
  if (mine) queryParams.set("mine", "true");
  if (sellerId) queryParams.set("sellerId", sellerId);

  const qs = queryParams.toString();

  return useQuery({
    queryKey: ["seller-products", params],
    queryFn: async () => {
      return api.get<ProductsResponse>(`/api/products?${qs}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["new-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      return api.get<{ product: Product }>(`/api/products/${id}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateProductData }) => {
      return api.put<{ product: Product }>(`/api/products/${id}`, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["new-arrivals"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
      queryClient.invalidateQueries({ queryKey: ["best-sellers"] });
    },
  });
}

export function useNewArrivals(limit = 8) {
  return useQuery({
    queryKey: ["new-arrivals", limit],
    queryFn: async () => {
      return api.get<ProductsResponse>(`/api/products?status=active&page=1&limit=${limit}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function usePublicProducts(params: Omit<ProductsParams, "mine" | "sellerId"> = {}) {
  const { page = 1, limit = 12, search, category, status = "active", minPrice, maxPrice, rating, sort } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (status) qs.set("status", status);
  if (minPrice !== undefined) qs.set("minPrice", String(minPrice));
  if (maxPrice !== undefined) qs.set("maxPrice", String(maxPrice));
  if (rating !== undefined) qs.set("rating", String(rating));
  if (sort) qs.set("sort", sort);
  return useQuery({
    queryKey: ["public-products", params],
    queryFn: async () => api.get<ProductsResponse>(`/api/products?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useShopProducts(params: ProductsParams & { sort?: string } = {}) {
  return usePublicProducts(params);
}

export interface BestSeller {
  product: Product;
  unitsSold: number;
  revenue: number;
  orders: number;
}

export function useBestSellers(limit = 6) {
  return useQuery({
    queryKey: ["best-sellers", limit],
    queryFn: async () => api.get<{ bestSellers: BestSeller[] }>(`/api/products/best-sellers?limit=${limit}`),
    placeholderData: keepPreviousData,
  });
}
