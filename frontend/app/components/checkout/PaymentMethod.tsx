"use client";

import { Wallet, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

type Method = "cod" | "stripe";

export function PaymentMethod({ value, onChange }: { value: Method; onChange: (v: Method) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-sm font-semibold tracking-wider uppercase">Payment Method</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive", icon: Wallet },
          { id: "stripe", label: "Stripe", desc: "Card • Apple Pay • Secure", icon: CreditCard },
        ] as const).map((opt) => {
          const active = value === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                active ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20" : "border-border bg-card hover:bg-muted/30"
              )}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-full border", active ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border")}>
                <Icon className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </span>
              <span className={cn("ml-auto size-5 rounded-full border flex items-center justify-center", active ? "border-primary bg-primary" : "border-border")}>
                {active && <span className="size-2 rounded-full bg-primary-foreground" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
