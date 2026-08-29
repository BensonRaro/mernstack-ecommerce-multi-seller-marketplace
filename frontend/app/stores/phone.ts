import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedPhone {
  id: string;
  label: string;
  number: string;
  isDefault?: boolean;
}

interface PhoneState {
  phones: SavedPhone[];
  selectedId: string | null;
  addPhone: (p: Omit<SavedPhone, "id">) => SavedPhone;
  select: (id: string) => void;
}

const seed: SavedPhone[] = [
  { id: "phone_1", label: "Mobile", number: "+1 (555) 014-2832", isDefault: true },
  { id: "phone_2", label: "Work", number: "+1 (555) 867-5309" },
];

export const usePhoneStore = create<PhoneState>()(
  persist(
    (set, get) => ({
      phones: seed,
      selectedId: seed[0]?.id ?? null,
      addPhone: (p) => {
        const id = `phone_${Date.now()}`;
        const entry = { ...p, id };
        set({ phones: [...get().phones, entry], selectedId: id });
        return entry;
      },
      select: (id) => set({ selectedId: id }),
    }),
    { name: "phone-storage" }
  )
);
