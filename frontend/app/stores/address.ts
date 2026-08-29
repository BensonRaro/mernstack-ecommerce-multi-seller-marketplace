import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

interface AddressState {
  addresses: SavedAddress[];
  selectedId: string | null;
  addAddress: (a: Omit<SavedAddress, "id">) => SavedAddress;
  select: (id: string) => void;
}

const seed: SavedAddress[] = [
  { id: "addr_1", label: "Home", street: "124 Maple Street", city: "Springfield, IL", zip: "62701", country: "United States", isDefault: true },
  { id: "addr_2", label: "Office", street: "88 Market Square", city: "Chicago, IL", zip: "60601", country: "United States" },
];

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: seed,
      selectedId: seed[0]?.id ?? null,
      addAddress: (a) => {
        const id = `addr_${Date.now()}`;
        const entry = { ...a, id };
        set({ addresses: [...get().addresses, entry], selectedId: id });
        return entry;
      },
      select: (id) => set({ selectedId: id }),
    }),
    { name: "address-storage" }
  )
);
