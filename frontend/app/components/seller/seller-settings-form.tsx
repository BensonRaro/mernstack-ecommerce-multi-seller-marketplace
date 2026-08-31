import { useEffect, useState } from "react";
import { Store, Clock, CheckCircle2, Save, RotateCcw, AtSign, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Field, FieldContent, FieldError, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useSellerMe, useUpdateSeller, useCheckUsername } from "@/hooks/use-auth";

export function SellerSettingsForm() {
  const { data, isLoading, isError, error } = useSellerMe();
  const updateSeller = useUpdateSeller();

  const seller = data?.seller;

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lowerUsername = username.toLowerCase().trim();
  const isUsernameChanged = seller ? lowerUsername !== (seller.username ?? "").toLowerCase() : false;
  const { data: checkData, isFetching: checkingUsername } = useCheckUsername(isUsernameChanged ? lowerUsername : "");

  useEffect(() => {
    if (seller) {
      setName(seller.name ?? "");
      setImage(seller.image ?? "");
      setDescription(seller.description ?? "");
      setUsername(seller.username ?? "");
    }
  }, [seller]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Store name is required";
    else if (name.trim().length > 80) e.name = "Store name must be under 80 characters";
    if (!username.trim()) e.username = "Username is required";
    else if (!/^[a-z0-9_-]{3,20}$/.test(username.toLowerCase().trim())) e.username = "3-20 chars, a-z 0-9 _ -";
    else if (isUsernameChanged && checkData && !checkData.available) e.username = checkData.reason || "Username taken";
    if (description.length > 500) e.description = "Description must be under 500 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleReset() {
    if (!seller) return;
    setName(seller.name ?? "");
    setImage(seller.image ?? "");
    setDescription(seller.description ?? "");
    setUsername(seller.username ?? "");
    setErrors({});
  }

  function handleSave() {
    if (!validate()) return;
    updateSeller.mutate(
      { name: name.trim(), image: image || null, description: description.trim() || null, username: lowerUsername },
      {
        onSuccess: () => toast.add({ type: "success", title: "Store updated" }),
        onError: (err) => toast.add({ type: "error", title: err.message }),
      }
    );
  }

  const isDirty =
    seller &&
    (name !== (seller.name ?? "") ||
      image !== (seller.image ?? "") ||
      description !== (seller.description ?? "") ||
      lowerUsername !== (seller.username ?? "").toLowerCase());

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty className="mx-auto max-w-2xl border py-16">
        <EmptyMedia variant="icon">
          <Store />
        </EmptyMedia>
        <EmptyTitle>Failed to load store</EmptyTitle>
        <EmptyDescription>{(error as Error)?.message || "Please try again."}</EmptyDescription>
      </Empty>
    );
  }

  if (!seller) {
    return (
      <Empty className="mx-auto max-w-2xl border py-16">
        <EmptyMedia variant="icon">
          <Store />
        </EmptyMedia>
        <EmptyTitle>No store found</EmptyTitle>
        <EmptyDescription>Create your seller profile first.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Store className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base normal-case tracking-tight">
                {seller.name}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase ring-1 ${
                    seller.approved
                      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20"
                      : seller.revokedAt
                        ? "bg-destructive/10 text-destructive ring-destructive/20"
                        : "bg-amber-500/10 text-amber-700 ring-amber-500/20"
                  }`}
                >
                  {seller.approved ? (
                    <CheckCircle2 className="size-3" />
                  ) : seller.revokedAt ? (
                    <XCircle className="size-3" />
                  ) : (
                    <Clock className="size-3" />
                  )}
                  {seller.approved ? "Approved" : seller.revokedAt ? "Revoked" : "Pending approval"}
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                {seller.approved
                  ? "Your store is active and visible to buyers."
                  : seller.revokedAt
                    ? "Your store has been revoked. Products are no longer visible."
                    : "Your store is under review. You can still edit details."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <AvatarUpload value={image} onChange={setImage} fallback={name.charAt(0)?.toUpperCase() || "S"} />
            <p className="text-xs text-muted-foreground">Store logo • Visible on product cards</p>
          </div>
        </CardContent>
      </Card>

      {!seller.approved && seller.revokedAt && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm normal-case tracking-tight text-destructive">
              <XCircle className="size-4" />
              Account Revoked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your seller account has been revoked. Your products are no longer visible on the platform, and you cannot create, edit, or delete products or promo codes.
            </p>
            {seller.revokedReason && (
              <div className="rounded-lg border border-destructive/20 bg-card p-3">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Reason from admin
                </p>
                <p className="mt-1 text-sm leading-relaxed">{seller.revokedReason}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Revoked on {new Date(seller.revokedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {!seller.approved && !seller.revokedAt && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm normal-case tracking-tight text-amber-700">
              <Clock className="size-4" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your seller application is under review. You can edit your store details while waiting for approval.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm normal-case tracking-tight">Store details</CardTitle>
          <CardDescription>Update your store name and description. Changes are visible immediately after approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="store-name">Store name</FieldLabel>
              <FieldContent>
                <Input
                  id="store-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nova Atelier"
                  aria-invalid={!!errors.name}
                  disabled={updateSeller.isPending}
                />
                <FieldError>{errors.name}</FieldError>
              </FieldContent>
            </Field>

            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="your_store"
                    className="pl-9"
                    aria-invalid={!!errors.username}
                    disabled={updateSeller.isPending}
                  />
                </div>
                <div className="mt-1 text-xs">
                  {checkingUsername ? (
                    <span className="text-muted-foreground">Checking...</span>
                  ) : isUsernameChanged && username.length >= 3 ? (
                    checkData?.available ? (
                      <span className="text-emerald-600">✓ Available — /{lowerUsername}</span>
                    ) : (
                      <span className="text-destructive">{checkData?.reason || "Username taken"}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">3-20 chars, a-z 0-9 _ - • Public at /{lowerUsername || "username"}</span>
                  )}
                </div>
                <FieldError>{errors.username}</FieldError>
                {seller?.username && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Public link:{" "}
                    <a href={`/${seller.username}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      /{seller.username}
                    </a>
                  </p>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!errors.description}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="store-description">Description</FieldLabel>
                <span className="text-xs tabular-nums text-muted-foreground">{description.length}/500</span>
              </div>
              <FieldContent>
                <Textarea
                  id="store-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell shoppers about your store, craft, and values..."
                  rows={4}
                  maxLength={500}
                  aria-invalid={!!errors.description}
                  disabled={updateSeller.isPending}
                />
                <FieldError>{errors.description}</FieldError>
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={handleSave} disabled={updateSeller.isPending || !isDirty} className="rounded-full">
              {updateSeller.isPending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
              Save changes
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={updateSeller.isPending || !isDirty} className="rounded-full">
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
            {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm font-medium">Need help?</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Store name is public. Description appears on your seller profile. Approval status is managed by admins. Contact support if you need to deactivate your store.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
