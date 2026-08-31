import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  pendingSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  salesOverTime: { date: string; revenue: number; orders: number }[];
  recentPendingSellers: {
    id: string;
    name: string;
    username: string | null;
    createdAt: string;
    user: { name: string | null; email: string };
  }[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
  });
}
