import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SellerOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  sellerId: string;
  product: { id: string; name: string; images: string[]; price: number; discount: number };
}

export interface SellerOrder {
  id: string;
  userId: string;
  status: string;
  deliveryStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  phoneNumber: string | null;
  promoCode: string | null;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  items: SellerOrderItem[];
  user?: { id: string; name: string | null; email: string; image: string | null };
  _allItemsCount?: number;
}

export interface SellerOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
}

export interface SellerOrdersResponse {
  orders: SellerOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useSellerOrders(params: SellerOrdersParams = {}) {
  const { page = 1, limit = 10, search, status, paymentStatus, deliveryStatus } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  if (paymentStatus) qs.set("paymentStatus", paymentStatus);
  if (deliveryStatus) qs.set("deliveryStatus", deliveryStatus);

  return useQuery({
    queryKey: ["seller-orders", params],
    queryFn: () => api.get<SellerOrdersResponse>(`/api/orders/seller?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useMyOrders(params: SellerOrdersParams = {}) {
  const { page = 1, limit = 10, search, paymentStatus, deliveryStatus } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (paymentStatus) qs.set("paymentStatus", paymentStatus);
  if (deliveryStatus) qs.set("deliveryStatus", deliveryStatus);

  return useQuery({
    queryKey: ["my-orders", params],
    queryFn: () => api.get<SellerOrdersResponse>(`/api/orders?${qs.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<{ order: SellerOrder }>(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-orders"] });
    },
  });
}
