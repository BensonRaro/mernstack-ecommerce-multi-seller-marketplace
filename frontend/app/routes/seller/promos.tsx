import { useState, useMemo } from "react";
import { Tag, Plus, Pencil, Trash2, Search, AlertCircle, Calendar, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { SearchInput } from "@/components/globals/search-input";
import { PromoDialog } from "@/components/promo/PromoDialog";
import { SellerRevocationBanner } from "@/components/seller/seller-revocation-banner";
import { useSellerPromos, useCreatePromo, useUpdatePromo, useDeletePromo } from "@/hooks/use-promos";
import { useSellerMe } from "@/hooks/use-auth";
import { toast } from "@/components/ui/toast";
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

export default function SellerPromos() {
  const { data, isLoading, isError, error, refetch } = useSellerPromos();
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const deletePromo = useDeletePromo();

  const { data: sellerData } = useSellerMe();
  const seller = sellerData?.seller;
  const isApproved = seller?.approved ?? false;
  const isRevoked = !isApproved && !!seller?.revokedAt;

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<import("@/hooks/use-promos").Promo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<import("@/hooks/use-promos").Promo | null>(null);

  const promos = data?.promos ?? [];
  const filtered = useMemo(() => {
    if (!search) return promos;
    const s = search.toLowerCase();
    return promos.filter((p) => p.code.toLowerCase().includes(s));
  }, [promos, search]);

  function handleCreate(data: { code: string; discountPercent: number; active: boolean; expiresAt: string | null }) {
    createPromo.mutate(data, {
      onSuccess: () => {
        toast.add({ type: "success", title: "Promo created" });
        setDialogOpen(false);
      },
      onError: (e) => toast.add({ type: "error", title: e.message }),
    });
  }

  function handleUpdate(data: { code: string; discountPercent: number; active: boolean; expiresAt: string | null }) {
    if (!editing) return;
    updatePromo.mutate(
      { id: editing.id, ...data },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: "Promo updated" });
          setDialogOpen(false);
          setEditing(null);
        },
        onError: (e) => toast.add({ type: "error", title: e.message }),
      }
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <SellerRevocationBanner
        approved={seller?.approved ?? false}
        revokedAt={seller?.revokedAt ?? null}
        revokedReason={seller?.revokedReason ?? null}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.7rem] font-semibold tracking-tight flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            Promo Codes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Create codes for your products. Buyers enter them at checkout.</p>
        </div>
        {isApproved && (
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            New promo
          </Button>
        )}
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search code..." className="w-full max-w-[360px]" />
          <span className="text-xs tracking-widest uppercase text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "promo" : "promos"}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <p className="text-sm font-medium">Failed to load promos</p>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Try again."}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="border-0 py-16">
            <EmptyMedia variant="icon">
              <Tag />
            </EmptyMedia>
            <EmptyTitle>{promos.length === 0 ? "No promos yet" : "No results"}</EmptyTitle>
            <EmptyDescription>
              {promos.length === 0 ? "Create your first promo code to boost sales." : `No promos match "${search}"`}
            </EmptyDescription>
            <EmptyContent>
              {promos.length === 0 ? (
                isApproved ? (
                  <Button size="sm" className="rounded-full" onClick={() => setDialogOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Create promo
                  </Button>
                ) : isRevoked ? (
                  <p className="text-sm text-muted-foreground">
                    Your seller account has been revoked. You cannot create promos.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your seller account is pending approval. You cannot create promos yet.
                  </p>
                )
              ) : (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((promo) => {
                  const expired = promo.expiresAt ? new Date(promo.expiresAt) < new Date() : false;
                  return (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tracking-widest uppercase">
                          <Tag className="size-3" />
                          {promo.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold">
                          <Percent className="size-3.5 text-muted-foreground" />
                          {promo.discountPercent}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase ring-1 ${promo.active && !expired ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20" : "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20"}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {expired ? "Expired" : promo.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isApproved ? (
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={promo.active}
                              onCheckedChange={(checked) => {
                                updatePromo.mutate(
                                  { id: promo.id, active: checked },
                                  {
                                    onSuccess: () => toast.add({ type: "success", title: checked ? "Activated" : "Deactivated" }),
                                    onError: (e) => toast.add({ type: "error", title: e.message }),
                                  }
                                );
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 rounded-full"
                              onClick={() => {
                                setEditing(promo);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 rounded-full text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(promo)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <PromoDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        promo={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        isPending={createPromo.isPending || updatePromo.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[420px] rounded-2xl">
          <AlertDialogHeader className="gap-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <div className="space-y-2 text-left">
              <AlertDialogTitle>Delete promo?</AlertDialogTitle>
              <AlertDialogDescription>
                Delete <span className="font-medium text-foreground">"{deleteTarget?.code}"</span> ? This cannot be undone.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deletePromo.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.add({ type: "success", title: "Promo deleted" });
                    setDeleteTarget(null);
                  },
                  onError: (e) => toast.add({ type: "error", title: e.message }),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
