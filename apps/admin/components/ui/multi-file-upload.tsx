"use client";

import * as React from "react";
import { Upload, X, Loader2, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface MultiFileUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  uploadFn?: (files: File[]) => Promise<{ urls: string[]; errors?: string[] }>;
}

export function MultiFileUpload({
  values = [],
  onChange,
  maxFiles = 10,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  label = "Görsel Ekle",
  description = "PNG, JPG, WebP veya GIF (max 5MB)",
  className,
  uploadFn,
}: MultiFileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const canAddMore = values.length < maxFiles && !disabled && !isUploading;

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);

    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - values.length;

    if (fileArray.length > remainingSlots) {
      setError(`En fazla ${remainingSlots} dosya daha eklenebilir`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (accept === "image/*" && !file.type.startsWith("image/")) {
        setError("Sadece resim dosyaları kabul edilir");
        return;
      }
      if (file.size > maxSize) {
        setError(
          `Dosya boyutu ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan küçük olmalıdır`,
        );
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = uploadFn
        ? await uploadFn(validFiles)
        : await api.upload.multiple(validFiles);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.urls.length > 0) {
        onChange([...values, ...result.urls]);
      }

      if (result.errors && result.errors.length > 0) {
        setError(result.errors.join(", "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!canAddMore) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canAddMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {values.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {values.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-slate-50"
            >
              <img
                src={url}
                alt={`Görsel ${index + 1}`}
                className="size-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholders/image-error.svg";
                }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-all hover:bg-red-600 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <span className="text-xs font-medium text-white">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all",
            values.length > 0 ? "h-32" : "h-48",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-slate-100",
            error && "border-red-300 bg-red-50",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="w-full max-w-[200px]">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Yükleniyor...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : error ? (
            <>
              <AlertCircle className="size-8 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                }}
                className="text-xs text-red-500 underline hover:text-red-700"
              >
                Tekrar dene
              </button>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                {values.length > 0 ? (
                  <Plus className="size-5" />
                ) : (
                  <Upload className="size-5" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {description}
                </p>
              </div>
              {values.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {values.length}/{maxFiles} görsel yüklendi
                </p>
              )}
            </>
          )}
        </div>
      )}

      {values.length >= maxFiles && !disabled && (
        <p className="text-center text-sm text-muted-foreground">
          Maksimum görsel sayısına ulaşıldı ({maxFiles})
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        disabled={!canAddMore}
        className="hidden"
      />
    </div>
  );
}
