import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/hooks/use-products";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => boolean;
  clearCart: () => void;
  count: () => number;
  total: () => number;
}

function getDiscountedPrice(product: Product) {
  return product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        const currentQty = existing?.quantity ?? 0;
        const nextQty = currentQty + quantity;

        if (product.stock !== undefined && nextQty > product.stock) return false;

        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: nextQty } : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
        return true;
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return true;
        }
        const item = get().items.find((i) => i.product.id === productId);
        if (!item) return false;
        if (item.product.stock !== undefined && quantity > item.product.stock) return false;
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
        return true;
      },

      clearCart: () => set({ items: [] }),

      count: () => get().items.reduce((s, i) => s + i.quantity, 0),

      total: () =>
        get().items.reduce((s, i) => s + getDiscountedPrice(i.product) * i.quantity, 0),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
