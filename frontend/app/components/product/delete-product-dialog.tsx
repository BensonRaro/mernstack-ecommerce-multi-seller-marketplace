import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/hooks/use-products";

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteProductDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="default"
        className="max-w-[420px] gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl"
      >
        <AlertDialogHeader className="gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <Trash2 className="size-5" />
          </div>
          <div className="space-y-2 text-left">
            <AlertDialogTitle className="font-heading text-xl normal-case tracking-tight">
              Delete product?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left leading-relaxed">
              {product ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">"{product.name}"</span>.{" "}
                  This action cannot be undone.
                </>
              ) : (
                "This action cannot be undone. This will permanently delete the product."
              )}
            </AlertDialogDescription>
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>All associated data will be removed from your catalog.</span>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className="rounded-full border-border bg-card text-xs tracking-widest uppercase"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs tracking-widest uppercase disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
