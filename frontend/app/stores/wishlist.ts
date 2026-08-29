import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/hooks/use-products";

interface WishlistState {
  items: Product[];
  toggle: (product: Product) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
  isWishlisted: (productId: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const exists = get().items.some((p) => p.id === product.id);
        if (exists) {
          set({ items: get().items.filter((p) => p.id !== product.id) });
          return false;
        }
        set({ items: [...get().items, product] });
        return true;
      },

      remove: (productId) =>
        set({ items: get().items.filter((p) => p.id !== productId) }),

      clear: () => set({ items: [] }),

      isWishlisted: (productId) => get().items.some((p) => p.id === productId),

      count: () => get().items.length,
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
