"use client";

import { Truck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type DeliveryStatus = "pickup" | "delivery";

export function DeliveryToggle({ value, onChange }: { value: DeliveryStatus; onChange: (v: DeliveryStatus) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["pickup", "delivery"] as const).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all",
              active ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20" : "border-border bg-card hover:bg-muted/30"
            )}
          >
            <span className={cn("flex size-9 items-center justify-center rounded-full border", active ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground")}>
              {opt === "pickup" ? <Store className="size-4" /> : <Truck className="size-4" />}
            </span>
            <span className="font-heading text-sm font-semibold capitalize tracking-wide">{opt}</span>
            <span className="text-xs text-muted-foreground">{opt === "pickup" ? "Collect from store • Free" : "Home delivery • $5"}</span>
            <span className={cn("absolute right-3 top-3 size-5 rounded-full border flex items-center justify-center", active ? "border-primary bg-primary" : "border-border")}>
              {active && <span className="size-2 rounded-full bg-primary-foreground" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
