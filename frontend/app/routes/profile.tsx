import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  User,
  LogOut,
  Loader2,
  Search,
  ShieldCheck,
  Clock,
  Folder,
  Star,
  Heart,
  Phone,
  MapPin,
  Mail,
  Plus,
  AlertCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CreditCard,
  User as UserIcon,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useUserProfile,
  useUpdateUserProfile,
  useAddresses,
  usePhones,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useCreatePhone,
  useUpdatePhone,
  useDeletePhone,
  useSetDefaultPhone,
  type Address as AddressType,
  type Phone as PhoneType,
} from "@/hooks/use-user-profile";
import { useSellerOrders } from "@/hooks/use-orders";
import { useMyOrders } from "@/hooks/use-orders";
import { useUserReviews } from "@/hooks/use-reviews";
import { useCreateReview } from "@/hooks/use-reviews";
import { useDeleteReview } from "@/hooks/use-reviews";
import { toast } from "@/components/ui/toast";
import { useAddressStore } from "@/stores/address";
import { usePhoneStore } from "@/stores/phone";
import type { Review as BaseReview } from "@/hooks/use-reviews";
import { cn } from "@/lib/utils";
import { Header } from "@/components/globals/header";

interface Review extends BaseReview {
  product?: { id: string; name: string; images: string[] };
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  sellerId: string;
  product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    discount: number;
  };
}

interface Order {
  id: string;
  status: string;
  deliveryStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  phoneNumber: string | null;
  promoCode: string | null;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _allItemsCount?: number;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function statusStyles(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400";
    case "shipped":
      return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400";
    case "delivered":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400";
    case "cancelled":
      return "bg-destructive/10 text-destructive ring-destructive/20";
    case "pending":
    default:
      return "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400";
  }
}

function paymentStyles(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20";
    case "failed":
      return "bg-destructive/10 text-destructive ring-destructive/20";
    default:
      return "bg-amber-500/10 text-amber-700 ring-amber-500/20";
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-4 ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/20"}`}
        />
      ))}
    </span>
  );
}

export default function Profile() {
  const { data: profile, isLoading, isError, error } = useUserProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateUserProfile();
  const {
    data: sellerOrders,
    isLoading: sellerLoading,
    refetch: refetchSellerOrders,
  } = useSellerOrders();
  const {
    data: myOrders,
    isLoading: myLoading,
    refetch: refetchMyOrders,
  } = useMyOrders();
  const { data: reviewsData, isLoading: reviewsLoading } = useUserReviews();
  const { mutate: createReview, isPending: reviewPending } = useCreateReview();
  const { mutate: deleteReview, isPending: deleteReviewPending } =
    useDeleteReview();

  // Address/Phone CRUD hooks
  const { data: addressesData, isLoading: addressesLoading } = useAddresses();
  const { data: phonesData, isLoading: phonesLoading } = usePhones();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const createPhone = useCreatePhone();
  const updatePhone = useUpdatePhone();
  const deletePhone = useDeletePhone();
  const setDefaultPhone = useSetDefaultPhone();

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [deleteAddressTarget, setDeleteAddressTarget] = useState<AddressType | null>(null);
  const [deletePhoneTarget, setDeletePhoneTarget] = useState<PhoneType | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(
    null,
  );
  const [editingPhone, setEditingPhone] = useState<PhoneType | null>(null);
  const [addressFormData, setAddressFormData] = useState<{
    label: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    isDefault: boolean;
  }>({
    label: "Home",
    street: "",
    city: "",
    zip: "",
    country: "United States",
    isDefault: false,
  });
  const [phoneFormData, setPhoneFormData] = useState<{
    label: string;
    number: string;
    isDefault: boolean;
  }>({
    label: "Mobile",
    number: "",
    isDefault: false,
  });

  const addresses = addressesData?.addresses ?? [];
  const phones = phonesData?.phones ?? [];

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressFormData({
      label: "Home",
      street: "",
      city: "",
      zip: "",
      country: "United States",
      isDefault: addresses.length === 0,
    });
    setAddressDialogOpen(true);
  };

  const openEditAddress = (addr: AddressType) => {
    setEditingAddress(addr);
    setAddressFormData({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setAddressDialogOpen(true);
  };

  const openAddPhone = () => {
    setEditingPhone(null);
    setPhoneFormData({
      label: "Mobile",
      number: "",
      isDefault: phones.length === 0,
    });
    setPhoneDialogOpen(true);
  };

  const openEditPhone = (ph: PhoneType) => {
    setEditingPhone(ph);
    setPhoneFormData({
      label: ph.label,
      number: ph.number,
      isDefault: ph.isDefault,
    });
    setPhoneDialogOpen(true);
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          ...addressFormData,
        });
        toast.add({ type: "success", title: "Address updated" });
      } else {
        await createAddress.mutateAsync(addressFormData);
        toast.add({ type: "success", title: "Address added" });
      }
      setAddressDialogOpen(false);
    } catch (e) {
      toast.add({
        type: "error",
        title: editingAddress
          ? "Failed to update address"
          : "Failed to add address",
      });
    }
  };

  const handlePhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPhone) {
        await updatePhone.mutateAsync({
          id: editingPhone.id,
          ...phoneFormData,
        });
        toast.add({ type: "success", title: "Phone updated" });
      } else {
        await createPhone.mutateAsync(phoneFormData);
        toast.add({ type: "success", title: "Phone added" });
      }
      setPhoneDialogOpen(false);
    } catch (e) {
      toast.add({
        type: "error",
        title: editingPhone ? "Failed to update phone" : "Failed to add phone",
      });
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddressTarget) return;
    try {
      await deleteAddress.mutateAsync(deleteAddressTarget.id);
      toast.add({ type: "success", title: "Address deleted" });
      setDeleteAddressTarget(null);
    } catch (e) {
      toast.add({ type: "error", title: "Failed to delete address" });
    }
  };

  const handleDeletePhone = async () => {
    if (!deletePhoneTarget) return;
    try {
      await deletePhone.mutateAsync(deletePhoneTarget.id);
      toast.add({ type: "success", title: "Phone deleted" });
      setDeletePhoneTarget(null);
    } catch (e) {
      toast.add({ type: "error", title: "Failed to delete phone" });
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress.mutateAsync(id);
      toast.add({ type: "success", title: "Default address updated" });
    } catch (e) {
      toast.add({ type: "error", title: "Failed to set default address" });
    }
  };

  const handleSetDefaultPhone = async (id: string) => {
    try {
      await setDefaultPhone.mutateAsync(id);
      toast.add({ type: "success", title: "Default phone updated" });
    } catch (e) {
      toast.add({ type: "error", title: "Failed to set default phone" });
    }
  };

  const orders =
    profile?.role === "seller"
      ? (sellerOrders?.orders ?? [])
      : (myOrders?.orders ?? []);
  const reviews = (reviewsData?.reviews ?? []) as Review[];

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-96 rounded-2xl" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Empty className="border py-16">
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>Error loading profile</EmptyTitle>
            <EmptyDescription>
              {(error as Error)?.message || "Failed to load profile"}
            </EmptyDescription>
            <Button size="sm" className="rounded-full" render={<Link to="/" />}>
              Back to home
            </Button>
          </Empty>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-6xl py-6 px-4 md:px-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            My Profile
          </h1>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base normal-case tracking-tight">
              <Avatar className="size-10">
                <AvatarImage
                  src={profile.image || undefined}
                  alt={profile.name}
                />
                <AvatarFallback className="text-lg font-semibold bg-muted">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold">{profile.name}</span>
              <span className="text-xs text-muted-foreground">
                {profile.email}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Addresses Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                  Addresses
                </h2>
                <Button variant="outline" size="sm" onClick={openAddAddress}>
                  <Plus className="size-4 mr-2" /> Add Address
                </Button>
              </div>
              {addressesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-20 rounded-xl border border-border bg-card"
                    />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <MapPin className="size-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No addresses saved
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={openAddAddress}
                  >
                    <Plus className="size-4 mr-2" /> Add your first address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full",
                            addr.isDefault
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <MapPin className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addr.label}</span>
                            {addr.isDefault && (
                              <Badge variant="default" className="ml-2">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {addr.street}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {addr.city} · {addr.zip} · {addr.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!addr.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            title="Set as default"
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditAddress(addr)}
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>
                        {addresses.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteAddressTarget(addr)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Phones Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                  Phone Numbers
                </h2>
                <Button variant="outline" size="sm" onClick={openAddPhone}>
                  <Plus className="size-4 mr-2" /> Add Phone
                </Button>
              </div>
              {phonesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-20 rounded-xl border border-border bg-card"
                    />
                  ))}
                </div>
              ) : phones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <Phone className="size-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No phone numbers saved
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={openAddPhone}
                  >
                    <Plus className="size-4 mr-2" /> Add your first phone
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {phones.map((ph) => (
                    <div
                      key={ph.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full",
                            ph.isDefault
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Phone className="size-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ph.label}</span>
                            {ph.isDefault && (
                              <Badge variant="default" className="ml-2">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium font-mono">
                            {ph.number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!ph.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSetDefaultPhone(ph.id)}
                            title="Set as default"
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditPhone(ph)}
                          title="Edit"
                        >
                          <Edit className="size-4" />
                        </Button>
                        {phones.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeletePhoneTarget(ph)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Orders and Reviews */}
        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="rounded-full bg-muted p-1">
            <TabsTrigger
              value="orders"
              className="rounded-full data-[state=active]:bg-card"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-full data-[state=active]:bg-card"
            >
              Reviews {reviews.length}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <OrdersTable
                orders={orders}
                isLoading={profile?.role === "seller" ? sellerLoading : myLoading}
                isError={isError}
                error={error}
                refetch={
                  profile?.role === "seller"
                    ? refetchSellerOrders
                    : refetchMyOrders
                }
                role={profile.role}
              />
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviewsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-24 rounded-xl border border-border bg-card"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <Empty className="rounded-2xl border py-12">
                <EmptyMedia variant="icon">
                  <Star className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No reviews yet</EmptyTitle>
                <EmptyDescription>
                  When you review a product, it'll appear here.
                </EmptyDescription>
              </Empty>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-8 flex-shrink-0">
                        <AvatarImage
                          src={review.user.image || undefined}
                          alt={review.user.name || ""}
                        />
                        <AvatarFallback className="text-xs">
                          {review.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {review.user.name || "Anonymous"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <StarRating rating={review.rating} />
                        <p className="mt-2 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                        {review.product?.images[0] && (
                          <img
                            src={review.product.images[0]}
                            alt={review.product.name}
                            className="size-8 rounded-lg object-cover mt-2"
                          />
                        )}
                        {review.product && (
                          <Link
                            to={`/product/${review.product.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline mt-2"
                          >
                            {review.product.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Address Dialog */}
        <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add Address"}
              </DialogTitle>
              <DialogDescription>Enter your delivery address</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddressSave}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={addressFormData.label}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    required
                    placeholder="Home, Office, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={addressFormData.street}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    required
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={addressFormData.city}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="New York"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input
                      id="zip"
                      value={addressFormData.zip}
                      onChange={(e) =>
                        setAddressFormData((prev) => ({
                          ...prev,
                          zip: e.target.value,
                        }))
                      }
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={addressFormData.country}
                      onChange={(e) =>
                        setAddressFormData((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      placeholder="United States"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressFormData.isDefault}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({
                        ...prev,
                        isDefault: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Set as default address
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createAddress.isPending || updateAddress.isPending}
                >
                  {createAddress.isPending || updateAddress.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Phone Dialog */}
        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPhone ? "Edit Phone" : "Add Phone"}
              </DialogTitle>
              <DialogDescription>Enter your phone number</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePhoneSave}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={phoneFormData.label}
                    onChange={(e) =>
                      setPhoneFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    required
                    placeholder="Mobile, Work, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Phone Number</Label>
                  <Input
                    id="number"
                    type="tel"
                    value={phoneFormData.number}
                    onChange={(e) =>
                      setPhoneFormData((prev) => ({
                        ...prev,
                        number: e.target.value,
                      }))
                    }
                    required
                    minLength={7}
                    placeholder="+1 (555) 014-2832"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={phoneFormData.isDefault}
                    onChange={(e) =>
                      setPhoneFormData((prev) => ({
                        ...prev,
                        isDefault: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Set as default phone
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createPhone.isPending || updatePhone.isPending}
                >
                  {createPhone.isPending || updatePhone.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhoneDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Address Confirmation */}
        <AlertDialog
          open={!!deleteAddressTarget}
          onOpenChange={(o) => !o && setDeleteAddressTarget(null)}
        >
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
                  Delete address?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left leading-relaxed">
                  {deleteAddressTarget ? (
                    <>
                      This will permanently delete the{" "}
                      <span className="font-medium text-foreground">
                        "{deleteAddressTarget.label}"
                      </span>{" "}
                      address. This action cannot be undone.
                    </>
                  ) : (
                    "This action cannot be undone."
                  )}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel
                disabled={deleteAddress.isPending}
                className="rounded-full border-border bg-card text-xs tracking-widest uppercase"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteAddress();
                }}
                disabled={deleteAddress.isPending}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs tracking-widest uppercase disabled:opacity-60"
              >
                {deleteAddress.isPending ? "Deleting…" : "Delete address"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Phone Confirmation */}
        <AlertDialog
          open={!!deletePhoneTarget}
          onOpenChange={(o) => !o && setDeletePhoneTarget(null)}
        >
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
                  Delete phone?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left leading-relaxed">
                  {deletePhoneTarget ? (
                    <>
                      This will permanently delete the{" "}
                      <span className="font-medium text-foreground">
                        "{deletePhoneTarget.label}"
                      </span>{" "}
                      phone number. This action cannot be undone.
                    </>
                  ) : (
                    "This action cannot be undone."
                  )}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel
                disabled={deletePhone.isPending}
                className="rounded-full border-border bg-card text-xs tracking-widest uppercase"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeletePhone();
                }}
                disabled={deletePhone.isPending}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs tracking-widest uppercase disabled:opacity-60"
              >
                {deletePhone.isPending ? "Deleting…" : "Delete phone"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function OrdersTable({
  orders,
  isLoading,
  isError,
  error,
  refetch,
  role,
}: {
  orders: Order[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  role: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[180px]" />
              <Skeleton className="h-3 w-[120px]" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" />
        </span>
        <p className="text-sm font-medium">Failed to load orders</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {(error as Error)?.message || "Something went wrong."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          className="rounded-full"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Empty className="border-0 py-16">
        <EmptyMedia variant="icon">
          <ShoppingBag />
        </EmptyMedia>
        <EmptyTitle>No orders yet</EmptyTitle>
        <EmptyDescription>
          {role === "seller"
            ? "Orders will appear here once customers purchase your products."
            : "Place your first order to see it here."}
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8"></TableHead>
            <TableHead>Order</TableHead>
            <TableHead>{role === "seller" ? "Customer" : "Items"}</TableHead>
            <TableHead>{role === "seller" ? "Items" : "Total"}</TableHead>
            <TableHead className="hidden sm:table-cell">Total</TableHead>
            <TableHead className="hidden sm:table-cell">Payment</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isExpanded = expanded.has(order.id);
            return (
              <>
                <TableRow
                  key={order.id}
                  className="group"
                  data-expanded={isExpanded ? "" : undefined}
                >
                  <TableCell className="w-8">
                    <button
                      type="button"
                      aria-label={
                        isExpanded ? "Collapse order" : "Expand order"
                      }
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpanded(order.id)}
                      className="flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-medium tracking-wide">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">
                        {order.deliveryStatus === "delivery" ? (
                          <Truck className="size-3" />
                        ) : (
                          <Package className="size-3" />
                        )}
                        {order.deliveryStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role === "seller" ? (
                      <div className="flex items-center gap-2">
                        {order.user?.image ? (
                          <img
                            src={order.user.image}
                            alt={order.user.name || ""}
                            className="size-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs">
                            <UserIcon className="size-3.5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-tight">
                            {order.user?.name || "Guest"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {order.user?.email || order.phoneNumber || "—"}
                          </p>
                          {order.phoneNumber && (
                            <p className="text-xs text-muted-foreground">
                              {order.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(order.id)}
                        className="flex items-center gap-2 text-left"
                      >
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((it) => (
                            <div
                              key={it.id}
                              className="size-8 overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              {it.product.images[0] ? (
                                <img
                                  src={it.product.images[0]}
                                  alt={it.product.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center">
                                  <Package className="size-3.5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            {order.items.length} item
                            {order.items.length !== 1 && "s"}
                          </span>
                          <span className="max-w-[160px] truncate text-xs text-muted-foreground">
                            {order.items
                              .map((i) => `${i.product.name} x${i.quantity}`)
                              .join(", ")}
                          </span>
                          <span className="text-xs font-medium text-primary">
                            {isExpanded
                              ? "Hide items"
                              : order.items.length > 1
                                ? `View ${order.items.length} items`
                                : "View item"}
                          </span>
                        </div>
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    {role === "seller" ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(order.id)}
                        className="flex items-center gap-2 text-left"
                      >
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((it) => (
                            <div
                              key={it.id}
                              className="size-8 overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              {it.product.images[0] ? (
                                <img
                                  src={it.product.images[0]}
                                  alt={it.product.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <div className="flex size-full items-center justify-center">
                                  <Package className="size-3.5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            {order.items.length} item
                            {order.items.length !== 1 && "s"}
                          </span>
                          <span className="max-w-[160px] truncate text-xs text-muted-foreground">
                            {order.items
                              .map((i) => `${i.product.name} x${i.quantity}`)
                              .join(", ")}
                          </span>
                          <span className="text-xs font-medium text-primary">
                            {isExpanded
                              ? "Hide items"
                              : order.items.length > 1
                                ? `View ${order.items.length} items`
                                : "View item"}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          ${order.total.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          sub ${order.subtotal.toFixed(2)}{" "}
                          {order.discount > 0 &&
                            `· -${order.discount.toFixed(2)}`}{" "}
                          {order.deliveryFee > 0 &&
                            `· ship $${order.deliveryFee.toFixed(2)}`}
                        </span>
                        {order.promoCode && (
                          <span className="text-xs text-emerald-600">
                            promo {order.promoCode}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        ${order.total.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        sub ${order.subtotal.toFixed(2)}{" "}
                        {order.discount > 0 &&
                          `· -${order.discount.toFixed(2)}`}{" "}
                        {order.deliveryFee > 0 &&
                          `· ship $${order.deliveryFee.toFixed(2)}`}
                      </span>
                      {order.promoCode && (
                        <span className="text-xs text-emerald-600">
                          promo {order.promoCode}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        <CreditCard className="size-3" />
                        {order.paymentMethod}
                      </span>
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-widest uppercase ring-1 ${paymentStyles(order.paymentStatus)}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {order.paymentStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase ring-1 ${statusStyles(order.status)}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 rounded-full"
                      onClick={() => toggleExpanded(order.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow
                    key={`${order.id}-expanded`}
                    className="bg-muted/20 hover:bg-muted/20"
                  >
                    <TableCell colSpan={8} className="p-0">
                      <div className="bg-muted/30 p-4">
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-heading text-sm font-semibold tracking-wide">
                              Order items · {order.items.length}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              Placed{" "}
                              {new Date(order.createdAt).toLocaleString()} •{" "}
                              {order.deliveryStatus} • {order.paymentMethod}
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {order.items.map((it) => (
                              <div
                                key={it.id}
                                className="flex gap-3 rounded-xl border border-border bg-card p-3"
                              >
                                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {it.product.images[0] ? (
                                    <img
                                      src={it.product.images[0]}
                                      alt={it.product.name}
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex size-full items-center justify-center">
                                      <Package className="size-5 text-muted-foreground/50" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-1 text-sm font-medium leading-tight">
                                    {it.product.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Quantity: {it.quantity}
                                  </p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-sm font-semibold">
                                      ${it.price.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      × {it.quantity}
                                    </span>
                                    <span className="ml-auto text-sm font-semibold text-primary">
                                      ${(it.price * it.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
