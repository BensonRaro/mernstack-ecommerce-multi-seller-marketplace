import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { toast } from "@/components/ui/toast";
import { useCreateSeller, useCheckUsername } from "@/hooks/use-auth";

interface BecomeSellerDialogProps {
  children: React.ReactNode;
  onSellerCreated?: () => void;
}

export function BecomeSellerDialog({
  children,
  onSellerCreated,
}: BecomeSellerDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const createSeller = useCreateSeller();
  const { data: checkData, isFetching: checkingUsername } = useCheckUsername(username.toLowerCase().trim());

  useEffect(() => {
    if (name && !username) {
      const slug = name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20);
      if (slug.length >= 3) setUsername(slug);
    }
  }, [name, username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lower = username.toLowerCase().trim();
    if (!/^[a-z0-9_-]{3,20}$/.test(lower)) {
      toast.add({ type: "error", title: "Invalid username", description: "3-20 chars, a-z 0-9 _ -" });
      return;
    }

    createSeller.mutate(
      { name, image, description, username: lower },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: "Seller profile created!",
            description: "Waiting for admin approval.",
          });
          setOpen(false);
          setName("");
          setImage("");
          setDescription("");
          setUsername("");
          onSellerCreated?.();
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Error",
            description: error.message || "Something went wrong",
          });
        },
      }
    );
  };

  const isValid = name.trim().length > 0 && /^[a-z0-9_-]{3,20}$/.test(username.toLowerCase().trim()) && (checkData?.available ?? true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" className="w-full" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Become a Seller</DialogTitle>
          <DialogDescription>
            Create your store profile to start selling on NovaTrend. Your profile
            will be reviewed by an admin before you can start listing products.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <AvatarUpload
              value={image}
              onChange={setImage}
              fallback={name.charAt(0).toUpperCase() || "S"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-name">Store Name *</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your store name"
              disabled={createSeller.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="your_store"
              disabled={createSeller.isPending}
              required
            />
            <p className="text-xs">
              {checkingUsername ? (
                <span className="text-muted-foreground">Checking...</span>
              ) : username.length >= 3 ? (
                checkData?.available ? (
                  <span className="text-emerald-600">✓ Available — /{username.toLowerCase()}</span>
                ) : (
                  <span className="text-destructive">{checkData?.reason || "Username taken"}</span>
                )
              ) : (
                <span className="text-muted-foreground">3-20 chars, a-z 0-9 _ - • Your store will be at /{username || "username"}</span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your store..."
              disabled={createSeller.isPending}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createSeller.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSeller.isPending || !isValid}>
              {createSeller.isPending ? "Creating..." : "Create Store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
