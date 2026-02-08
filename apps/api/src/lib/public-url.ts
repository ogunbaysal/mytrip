import { buildPublicObjectUrl } from "./object-storage.ts";

function normalizeLegacyUploadPath(value: string): string {
  if (value.startsWith("/uploads/")) return value.slice("/uploads/".length);
  if (value.startsWith("/")) return value.slice(1);
  return value;
}

export function toPublicUploadUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const normalized = normalizeLegacyUploadPath(value);
  if (!normalized) return value;

  try {
    return buildPublicObjectUrl(normalized);
  } catch {
    return value;
  }
}
