import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldContent, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { ProductImageUpload } from "@/components/ui/product-image-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";
import { useCreateProduct, useProduct, useUpdateProduct } from "@/hooks/use-products";
import { useSellerMe } from "@/hooks/use-auth";
import { SellerRevocationBanner } from "@/components/seller/seller-revocation-banner";
import { categories } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { Save, Plus, X, ArrowLeft, AlertCircle, Ban } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];
const PRESET_COLORS = [
  "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#78716C",
];

export default function CreateProduct() {
  const navigate = useNavigate();
  const params = useParams();
  const id = (params as Record<string, string | undefined>).id;
  const isEdit = Boolean(id);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: productData, isLoading: isLoadingProduct, isError: isProductError, error: productError } = useProduct(isEdit ? id : undefined);
  const { data: sellerData } = useSellerMe();
  const seller = sellerData?.seller;
  const isApproved = seller?.approved ?? false;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [gender, setGender] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [colorInput, setColorInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasPrefilled, setHasPrefilled] = useState(false);

  useEffect(() => {
    if (isEdit && productData?.product && !hasPrefilled) {
      const p = productData.product;
      setName(p.name);
      setDescription(p.description ?? "");
      setPrice(String(p.price));
      setDiscount(p.discount ? String(p.discount) : "");
      setCategory(p.category);
      setImages(p.images ?? []);
      setStock(String(p.stock ?? 0));
      setSizes(p.sizes ?? []);
      setColors(p.colors ?? []);
      setGender(p.gender);
      setStatus(p.status ?? "draft");
      setHasPrefilled(true);
    }
  }, [isEdit, productData, hasPrefilled]);

  useEffect(() => {
    if (!isEdit) {
      setHasPrefilled(false);
    }
  }, [isEdit, id]);

  function toggleSize(size: string) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function toggleGender(value: string) {
    setGender((prev) => (prev === value ? null : value));
  }

  function addColor(hex: string) {
    const trimmed = hex.trim();
    if (trimmed && !colors.includes(trimmed)) {
      setColors((prev) => [...prev, trimmed]);
      setColorInput("");
    }
  }

  function removeColor(hex: string) {
    setColors((prev) => prev.filter((c) => c !== hex));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Product name is required";
    if (!price || Number(price) <= 0) e.price = "A valid price is required";
    if (!category) e.category = "Please select a category";
    if (discount && (Number(discount) < 0 || Number(discount) > 100)) {
      e.discount = "Discount must be between 0 and 100";
    }
    if (stock && Number(stock) < 0) e.stock = "Stock cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const isPending = createProduct.isPending || updateProduct.isPending;

  function handleSubmit(statusValue?: string) {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      discount: discount ? Number(discount) : undefined,
      category,
      images,
      stock: stock ? Number(stock) : 0,
      sizes,
      colors,
      gender,
      status: statusValue || status,
    };

    if (isEdit && id) {
      updateProduct.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.add({ type: "success", title: "Product updated" });
            navigate("/seller/products");
          },
          onError: (error) => {
            toast.add({
              type: "error",
              title: "Failed to update product",
              description: error.message,
            });
          },
        }
      );
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => {
          toast.add({ type: "success", title: "Product created" });
          navigate("/seller/products");
        },
        onError: (error) => {
          toast.add({
            type: "error",
            title: "Failed to create product",
            description: error.message,
          });
        },
      });
    }
  }

  if (isEdit && isLoadingProduct) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Skeleton className="h-[220px] rounded-xl" />
            <Skeleton className="h-[180px] rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[320px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isEdit && isProductError) {
    return (
      <div className="mx-auto max-w-6xl">
        <Empty className="border py-16">
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Failed to load product</EmptyTitle>
          <EmptyDescription>{(productError as Error)?.message || "Product not found or you don't have permission."}</EmptyDescription>
          <EmptyContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/seller/products")}>
                <ArrowLeft data-icon="inline-start" />
                Back to products
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <SellerRevocationBanner
          approved={seller?.approved ?? false}
          revokedAt={seller?.revokedAt ?? null}
          revokedReason={seller?.revokedReason ?? null}
        />
        <Empty className="border py-16">
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>{seller?.revokedAt ? "Account Revoked" : "Account Not Approved"}</EmptyTitle>
          <EmptyDescription>
            {seller?.revokedAt
              ? "Your seller account has been revoked. You cannot create or edit products."
              : "Your seller account is pending approval. You cannot create products yet."}
          </EmptyDescription>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => navigate("/seller/products")}>
              <ArrowLeft data-icon="inline-start" />
              Back to products
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const isRejected = isEdit && productData?.product?.status === "rejected";
  const rejectionReason = isEdit ? productData?.product?.rejectionReason : null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEdit && (
            <Button variant="ghost" size="icon-sm" className="rounded-full" render={<Link to="/seller/products" />}>
              <ArrowLeft />
            </Button>
          )}
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            {isEdit && productData?.product && (
              <p className="text-xs text-muted-foreground">Editing <span className="font-medium text-foreground">{productData.product.name}</span></p>
            )}
          </div>
          {isEdit && isPending && <Spinner className="size-4 text-muted-foreground" />}
        </div>
        {!isRejected && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isPending}
              className="rounded-full"
            >
              <Save data-icon="inline-start" />
              {isEdit ? "Save Draft" : "Save Draft"}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit("active")}
              disabled={isPending}
              className="rounded-full"
            >
              {isPending ? <Spinner data-icon="inline-start" /> : isEdit ? <Save data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
              {isEdit ? "Update Product" : "Add Product"}
            </Button>
          </div>
        )}
      </div>

      {isRejected && rejectionReason && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Ban className="size-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-destructive">Product Rejected</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                This product was rejected by an admin. You cannot edit or delete it.
              </p>
              <div className="mt-2 rounded-lg bg-background/80 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">Reason:</p>
                <p className="mt-0.5 text-sm">{rejectionReason}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); if (!isRejected) handleSubmit(); }}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Name Product</FieldLabel>
                    <FieldContent>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Puffer Jacket With Pocket Detail"
                        aria-invalid={!!errors.name}
                        disabled={isPending || isRejected}
                      />
                      <FieldError>{errors.name}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">Description Product</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your product..."
                        rows={5}
                        disabled={isPending || isRejected}
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">Size</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Pick Available Size
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSize(s)}
                          disabled={isPending || isRejected}
                          className={cn(
                            "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors",
                            sizes.includes(s)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium">Gender</p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Pick Available Gender
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => toggleGender(g.value)}
                          disabled={isPending || isRejected}
                          className={cn(
                            "flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
                            gender === g.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                          )}
                        >
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              gender === g.value ? "bg-primary-foreground" : "bg-muted-foreground/40"
                            )}
                          />
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing And Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Field data-invalid={!!errors.price}>
                    <FieldLabel htmlFor="price">Base Pricing</FieldLabel>
                    <FieldContent>
                      <Input
                        id="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="$0.00"
                        aria-invalid={!!errors.price}
                        disabled={isPending || isRejected}
                      />
                      <FieldError>{errors.price}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!errors.stock}>
                    <FieldLabel htmlFor="stock">Stock</FieldLabel>
                    <FieldContent>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        step="1"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="0"
                        aria-invalid={!!errors.stock}
                        disabled={isPending || isRejected}
                      />
                      <FieldError>{errors.stock}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!errors.discount}>
                    <FieldLabel htmlFor="discount">Discount</FieldLabel>
                    <FieldContent>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0%"
                        aria-invalid={!!errors.discount}
                        disabled={isPending || isRejected}
                      />
                      <FieldError>{errors.discount}</FieldError>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="status">Product Status</FieldLabel>
                    <FieldContent>
                      <NativeSelect
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={isPending || isRejected}
                      >
                        <NativeSelectOption value="draft">Draft</NativeSelectOption>
                        <NativeSelectOption value="active">Active</NativeSelectOption>
                        <NativeSelectOption value="archived">Archived</NativeSelectOption>
                      </NativeSelect>
                    </FieldContent>
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Img</CardTitle>
              </CardHeader>
              <CardContent>
                {images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="aspect-square overflow-hidden rounded-xl border border-border">
                      <img
                        src={images[0]}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((url, i) => (
                        <div
                          key={url}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                        >
                          <img
                            src={url}
                            alt={`Image ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border">
                    <p className="text-sm text-muted-foreground">No images yet</p>
                  </div>
                )}
                <div className="mt-4">
                  <ProductImageUpload
                    value={images}
                    onChange={setImages}
                    maxFiles={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Field data-invalid={!!errors.category}>
                  <FieldLabel>Product Category</FieldLabel>
                  <FieldContent>
                    <NativeSelect
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isPending || isRejected}
                    >
                      <NativeSelectOption value="">Select category</NativeSelectOption>
                      {categories.map((cat) => (
                        <NativeSelectOption key={cat.id} value={cat.slug}>
                          {cat.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldError>{errors.category}</FieldError>
                  </FieldContent>
                </Field>
                {category && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                      {categories.find((c) => c.slug === category)?.name}
                      <button
                        type="button"
                        onClick={() => setCategory("")}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                        disabled={isPending || isRejected}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Colors</CardTitle>
                <FieldDescription>Pick available colors</FieldDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        colors.includes(hex) ? removeColor(hex) : addColor(hex)
                      }
                      disabled={isPending || isRejected}
                      className={cn(
                        "size-8 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50",
                        colors.includes(hex)
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border",
                        hex === "#FFFFFF" && "bg-white"
                      )}
                      style={hex !== "#FFFFFF" ? { backgroundColor: hex } : undefined}
                      title={hex}
                    />
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="#hex or color name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addColor(colorInput);
                      }
                    }}
                    disabled={isPending || isRejected}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addColor(colorInput)}
                    disabled={!colorInput.trim() || isPending || isRejected}
                  >
                    Add
                  </Button>
                </div>
                {colors.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((hex) => (
                      <span
                        key={hex}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium"
                      >
                        <span
                          className="size-3 rounded-full border border-border"
                          style={hex !== "#FFFFFF" ? { backgroundColor: hex } : undefined}
                        />
                        {hex}
                        <button
                          type="button"
                          onClick={() => removeColor(hex)}
                          className="rounded-full p-0.5 hover:bg-foreground/10"
                          disabled={isPending || isRejected}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
