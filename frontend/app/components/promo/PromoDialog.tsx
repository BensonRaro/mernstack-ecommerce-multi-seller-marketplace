"use client";

import { useEffect, useState } from "react";
import { Tag, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldContent, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { Promo } from "@/hooks/use-promos";

interface PromoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promo?: Promo | null;
  onSubmit: (data: { code: string; discountPercent: number; active: boolean; expiresAt: string | null }) => void;
  isPending?: boolean;
}

export function PromoDialog({ open, onOpenChange, promo, onSubmit, isPending }: PromoDialogProps) {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (promo) {
      setCode(promo.code);
      setDiscount(String(promo.discountPercent));
      setActive(promo.active);
      setExpiresAt(promo.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 10) : "");
    } else {
      setCode("");
      setDiscount("");
      setActive(true);
      setExpiresAt("");
    }
    setErrors({});
  }, [promo, open]);

  function validate() {
    const e: Record<string, string> = {};
    if (!code.trim() || code.trim().length < 3) e.code = "Code must be at least 3 chars";
    const d = Number(discount);
    if (!discount || Number.isNaN(d) || d < 1 || d > 90) e.discount = "1–90%";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      code: code.trim().toUpperCase(),
      discountPercent: Number(discount),
      active,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Tag className="size-4" />
            </span>
            {promo ? "Edit promo" : "New promo code"}
          </DialogTitle>
          <DialogDescription>Share this code with buyers. Applies to your products only.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="code">Code</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE10" className="pl-9 uppercase" disabled={isPending} />
              </div>
              <FieldError>{errors.code}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.discount}>
            <FieldLabel htmlFor="discount">Discount %</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Percent className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="discount" type="number" min={1} max={90} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="10" className="pl-9" disabled={isPending} />
              </div>
              <FieldError>{errors.discount}</FieldError>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="expiresAt">Expires at (optional)</FieldLabel>
            <FieldContent>
              <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={isPending} />
            </FieldContent>
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
            <Label htmlFor="active" className="text-sm font-medium">
              Active
            </Label>
            <Switch id="active" checked={active} onCheckedChange={setActive} disabled={isPending} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button className="rounded-full" onClick={handleSubmit} disabled={isPending}>
            {promo ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
