import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

import type { Product } from "@/hooks/use-products";

export interface BestSellerItem {
  product: Product;
  unitsSold: number;
  revenue: number;
  orders: number;
}

export interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  totalReviews: number;
  salesOverTime: SalesPoint[];
  bestSellers: BestSellerItem[];
}

export function useSellerStats() {
  return useQuery({
    queryKey: ["seller-stats"],
    queryFn: () => api.get<SellerStats>("/api/seller/stats"),
  });
}
