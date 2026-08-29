"use client";

import { MapPin, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAddressStore } from "@/stores/address";

export function AddressSelector() {
  const { addresses, selectedId, select } = useAddressStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Delivery Address</h3>
        <span className="text-xs text-muted-foreground">{addresses.length} saved</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((addr) => {
          const active = selectedId === addr.id;
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => select(addr.id)}
              className={cn(
                "group relative flex flex-col gap-2 rounded-2xl border bg-card p-4 text-left transition-all",
                active ? "border-primary ring-1 ring-primary/20 bg-primary/[0.03]" : "border-border hover:border-foreground/20 hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border text-[10px]",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                )}
              >
                {active && <span className="size-2 rounded-full bg-primary-foreground" />}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                <MapPin className="size-3.5" />
                {addr.label}
                {addr.isDefault && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">Default</span>}
              </span>
              <span className="text-sm font-medium leading-tight">{addr.street}</span>
              <span className="text-xs text-muted-foreground">
                {addr.city} · {addr.zip}
              </span>
              <span className="text-xs text-muted-foreground">{addr.country}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100">
                <Pencil className="size-3" /> Edit
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          onClick={() => {
            const street = window.prompt("Street");
            if (!street) return;
            const city = window.prompt("City") || "";
            const zip = window.prompt("ZIP") || "";
            if (!city || !zip) return;
            useAddressStore.getState().addAddress({ label: "New", street, city, zip, country: "United States" });
          }}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-muted">
            <Plus className="size-4" />
          </span>
          Add new address
        </button>
      </div>
    </div>
  );
}
