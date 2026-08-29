import { useCallback, useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useDeleteFile } from "@/hooks/use-auth";

interface AvatarUploadProps {
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
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

export function AvatarUpload({
  value,
  onChange,
  fallback,
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteFile = useDeleteFile();

  const { startUpload } = useUploadThing("avatarUploader", {
    onUploadBegin: () => setIsUploading(true),
    onClientUploadComplete: (res) => {
      if (res.length > 0) {
        onChange(res[0].url);
      }
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

      await startUpload(Array.from(files));

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [startUpload]
  );

  const handleDelete = useCallback(() => {
    const key = extractFileKey(value);
    if (!key) {
      onChange("");
      return;
    }

    deleteFile.mutate(key, {
      onSuccess: () => {
        onChange("");
        toast.add({ type: "success", title: "Image removed" });
      },
      onError: () => {
        toast.add({ type: "error", title: "Failed to remove image" });
      },
    });
  }, [value, onChange, deleteFile]);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={value} alt="Store logo" className="object-cover" />
          <AvatarFallback className="text-2xl font-semibold bg-muted">
            {fallback}
          </AvatarFallback>
        </Avatar>

        {(isUploading || deleteFile.isPending) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || deleteFile.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-3.5 w-3.5" />
            {isUploading ? "Uploading..." : "Choose file"}
          </Button>
        )}

        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || deleteFile.isPending}
            onClick={handleDelete}
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <p className="text-[11px] text-muted-foreground/60">
        JPG, PNG or GIF. Max 2MB.
      </p>
    </div>
  );
}
