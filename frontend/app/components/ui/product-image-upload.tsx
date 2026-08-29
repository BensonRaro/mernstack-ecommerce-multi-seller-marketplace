import { useCallback, useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useDeleteFile } from "@/hooks/use-auth";

interface ProductImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
  className?: string;
}

function extractFileKey(url: string): string | null {
  try {
    const parts = url.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

export function ProductImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  className,
}: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteFile = useDeleteFile();

  const { startUpload } = useUploadThing("productImageUploader", {
    onUploadBegin: () => setIsUploading(true),
    onClientUploadComplete: (res) => {
      const newUrls = res.map((file) => file.url);
      onChange([...value, ...newUrls]);
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.add({ type: "error", title: "Upload failed", description: error.message });
      setIsUploading(false);
    },
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = maxFiles - value.length;
      const toUpload = Array.from(files).slice(0, remaining);

      if (toUpload.length < files.length) {
        toast.add({
          type: "error",
          title: "Too many files",
          description: `You can only upload ${remaining} more image(s).`,
        });
      }

      await startUpload(toUpload);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [startUpload, value.length, maxFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      const url = value[index];
      const key = extractFileKey(url);

      if (!key) {
        onChange(value.filter((_, i) => i !== index));
        return;
      }

      deleteFile.mutate(key, {
        onSuccess: () => {
          onChange(value.filter((_, i) => i !== index));
        },
        onError: () => {
          toast.add({ type: "error", title: "Failed to remove image" });
        },
      });
    },
    [value, onChange, deleteFile]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {deleteFile.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={deleteFile.isPending}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <div>
          {isUploading ? (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8">
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload images
            </Button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
