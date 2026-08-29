"use client";

import { Phone, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePhoneStore } from "@/stores/phone";

export function PhoneSelector() {
  const { phones, selectedId, select } = usePhoneStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Phone Number</h3>
        <span className="text-xs text-muted-foreground">{phones.length} saved</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {phones.map((p) => {
          const active = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-all",
                active ? "border-primary ring-1 ring-primary/20 bg-primary/[0.03]" : "border-border hover:border-foreground/20 hover:bg-muted/30"
              )}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-full border", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground")}>
                <Phone className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{p.label}</span>
                <span className="text-sm font-medium">{p.number}</span>
              </span>
              <span className={cn("ml-auto flex size-5 items-center justify-center rounded-full border", active ? "border-primary bg-primary" : "border-border")}>
                {active && <span className="size-2 rounded-full bg-primary-foreground" />}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-medium text-muted-foreground hover:bg-muted/30"
          onClick={() => {
            const number = window.prompt("Phone number");
            if (!number) return;
            usePhoneStore.getState().addPhone({ label: "Mobile", number });
          }}
        >
          <Plus className="size-4" />
          Add phone
        </button>
      </div>
    </div>
  );
}
