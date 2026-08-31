import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface Phone {
  id: string;
  label: string;
  number: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  defaultAddress: Address | null;
  defaultPhone: Phone | null;
  addresses: Address[];
  phones: Phone[];
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      return api.get<UserProfile>("/api/user/profile");
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      phone: string;
    }) => {
      return api.put<UserProfile>("/api/user/profile", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["user-addresses"],
    queryFn: async () => {
      return api.get<{ addresses: Address[] }>("/api/user/addresses");
    },
  });
}

export function usePhones() {
  return useQuery({
    queryKey: ["user-phones"],
    queryFn: async () => {
      return api.get<{ phones: Phone[] }>("/api/user/phones");
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      label: string;
      street: string;
      city: string;
      zip: string;
      country: string;
      isDefault?: boolean;
    }) => {
      return api.post<{ address: Address }>("/api/user/addresses", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Address>) => {
      return api.put<{ address: Address }>(`/api/user/addresses/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/api/user/addresses/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-addresses"] });
    },
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<{ success: boolean }>(`/api/user/addresses/${id}/default`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-addresses"] });
    },
  });
}

export function useCreatePhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      label: string;
      number: string;
      isDefault?: boolean;
    }) => {
      return api.post<{ phone: Phone }>("/api/user/phones", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-phones"] });
    },
  });
}

export function useUpdatePhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Phone>) => {
      return api.put<{ phone: Phone }>(`/api/user/phones/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-phones"] });
    },
  });
}

export function useDeletePhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/api/user/phones/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-phones"] });
    },
  });
}

export function useSetDefaultPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return api.post<{ success: boolean }>(`/api/user/phones/${id}/default`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["user-phones"] });
    },
  });
}