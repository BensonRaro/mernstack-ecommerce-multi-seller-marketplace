"use client";

import { useEffect, useState } from "react";
import { Tag, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PromoFieldProps {
  value: string;
  discount: number;
  sellerName?: string | null;
  isPending?: boolean;
  onApply: (code: string) => Promise<{ ok: boolean; discount?: number; message?: string }>;
  onClear: () => void;
}

export function PromoField({ value, discount, sellerName, isPending, onApply, onClear }: PromoFieldProps) {
  const [input, setInput] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-heading text-sm font-semibold tracking-wider uppercase flex items-center gap-2">
        <Tag className="size-4 text-primary" />
        Promo Code
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">Enter a code from any seller (e.g. seller promo) — try SAVE10</p>

      {discount > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2.5 ring-1 ring-emerald-500/20">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="size-4" />
            {value} — {discount}% off {sellerName ? `· ${sellerName}` : ""}
          </span>
          <button type="button" onClick={() => { setInput(""); setError(null); onClear(); }} className="rounded-full p-1 hover:bg-black/5">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Input value={input} onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(null); }} placeholder="Enter code" className="h-10 rounded-full border border-border bg-background px-4" disabled={isPending} />
          <Button
            type="button"
            size="sm"
            className="h-10 rounded-full px-6"
            disabled={isPending || !input.trim()}
            onClick={async () => {
              const res = await onApply(input.trim().toUpperCase());
              if (!res.ok) setError(res.message || "Invalid code");
              else setError(null);
            }}
          >
            {isPending ? "Checking…" : "Apply"}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
