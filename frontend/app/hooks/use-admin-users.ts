import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    username: string | null;
    approved: boolean;
  } | null;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export function useAdminUsers(params: UsersParams = {}) {
  const { page = 1, limit = 10, search = "", role = "" } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (role) qs.set("role", role);

  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => api.get<UsersResponse>(`/api/admin/users?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) =>
      api.patch<{ success: boolean }>(`/api/admin/users/${id}/ban`, { banned }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
