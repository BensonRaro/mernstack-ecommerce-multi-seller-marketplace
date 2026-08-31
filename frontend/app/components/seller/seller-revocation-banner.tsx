import { AlertCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerRevocationBannerProps {
  approved: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  className?: string;
}

export function SellerRevocationBanner({
  approved,
  revokedAt,
  revokedReason,
  className,
}: SellerRevocationBannerProps) {
  if (approved) return null;

  if (revokedAt) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4",
          className,
        )}
        role="alert"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <XCircle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-heading text-sm font-semibold tracking-tight text-destructive">
            Your seller account has been revoked
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Your products are no longer visible on the platform, and you cannot create, edit, or delete products or promo codes.
            To regain access, please contact support or reply with the reason below.
          </p>
          {revokedReason && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-card p-3">
              <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Reason from admin
              </p>
              <p className="mt-1 text-sm leading-relaxed">{revokedReason}</p>
            </div>
          )}
          {revokedAt && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Revoked on {new Date(revokedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4",
        className,
      )}
      role="alert"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
        <Clock className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="font-heading text-sm font-semibold tracking-tight text-amber-700">
          Your seller application is pending approval
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">
          You can&apos;t create or manage products until an admin approves your account. This usually takes 1–2 business days.
        </p>
      </div>
    </div>
  );
}
