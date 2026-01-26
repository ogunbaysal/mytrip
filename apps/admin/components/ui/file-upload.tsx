"use client";

import * as React from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "banner";
  uploadFn?: (file: File) => Promise<{ url: string }>;
}

export function FileUpload({
  value,
  onChange,
  onRemove,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  label = "Görsel Yükle",
  description = "PNG, JPG, WebP veya GIF (max 5MB)",
  className,
  aspectRatio = "video",
  uploadFn,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
  };

  const handleFile = async (file: File) => {
    setError(null);

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

    setIsUploading(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = uploadFn
        ? await uploadFn(file)
        : await api.upload.single(file);

      clearInterval(progressInterval);
      setProgress(100);
      onChange(result.url);
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

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange("");
    onRemove?.();
    setError(null);
  };

  if (value) {
    return (
      <div className={cn("relative w-full", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-border bg-slate-50",
            aspectClasses[aspectRatio],
          )}
        >
          <img
            src={value}
            alt="Yüklenen görsel"
            className="size-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "/images/placeholders/image-error.svg";
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:scale-105"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all",
          aspectClasses[aspectRatio],
          isDragging
            ? "border-primary bg-primary/5"
            : "border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-slate-100",
          (disabled || isUploading) && "cursor-not-allowed opacity-60",
          error && "border-red-300 bg-red-50",
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="size-10 animate-spin text-primary" />
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
            <AlertCircle className="size-10 text-red-500" />
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
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Upload className="size-6" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Sürükle bırak veya tıklayın
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
