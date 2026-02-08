import { v4 as uuidv4 } from "uuid";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "../db/index.ts";
import { file, user } from "../db/schemas/index.ts";
import { uploadToObjectStorage } from "./object-storage.ts";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_USAGES = new Set([
  "blog_hero",
  "blog_featured",
  "blog_content",
  "place_image",
  "place_gallery",
  "business_document",
  "profile_avatar",
  "profile_cover",
  "other",
]);

function normalizeUsage(rawUsage: string | undefined): string {
  if (!rawUsage) return "other";
  const value = rawUsage.trim();
  if (!value) return "other";
  return ALLOWED_FILE_USAGES.has(value) ? value : "other";
}

function getFileType(
  mimeType: string,
): "image" | "document" | "video" | "audio" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf") || mimeType.includes("document")) {
    return "document";
  }
  return "other";
}

function validateFile(
  fileData: globalThis.File,
  usage: string,
): { ok: true } | { ok: false; error: string } {
  const isBusinessDocument = usage === "business_document";
  const allowedTypes = isBusinessDocument
    ? ALLOWED_DOCUMENT_TYPES
    : ALLOWED_IMAGE_TYPES;
  const maxSize = isBusinessDocument ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;

  if (!allowedTypes.includes(fileData.type)) {
    return {
      ok: false,
      error: isBusinessDocument
        ? `Invalid file type: ${fileData.type}. Allowed: pdf`
        : `Invalid file type: ${fileData.type}. Allowed: jpg, png, webp, gif`,
    };
  }

  if (fileData.size > maxSize) {
    return {
      ok: false,
      error: `File too large. Maximum size is ${Math.round(
        maxSize / 1024 / 1024,
      )}MB`,
    };
  }

  return { ok: true };
}

export async function processFileUpload(
  fileData: globalThis.File,
  userId: string,
  uploader?: {
    email?: string | null;
    name?: string | null;
  },
  rawUsage?: string,
): Promise<{ url: string; fileId: string } | { error: string }> {
  const usage = normalizeUsage(rawUsage);
  const validation = validateFile(fileData, usage);

  if (!validation.ok) {
    return { error: validation.error };
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const objectData = new Uint8Array(arrayBuffer);

  const objectUpload = await uploadToObjectStorage({
    data: objectData,
    mimeType: fileData.type,
    usage,
    filename: fileData.name,
  });

  const fileId = uuidv4();
  const fallbackFilename = objectUpload.key.split("/").pop() || objectUpload.key;
  const uploadedById = await resolveUploadedByUserId(userId, uploader);

  await db.insert(file).values({
    id: fileId,
    filename: fileData.name || fallbackFilename,
    storedFilename: objectUpload.key,
    url: objectUpload.url,
    mimeType: fileData.type,
    size: fileData.size,
    type: getFileType(fileData.type),
    usage: usage as any,
    uploadedById,
  });

  return { url: objectUpload.url, fileId };
}

function normalizeEmail(value?: string | null): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

function makeFallbackEmail(userId: string): string {
  const safe = userId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = safe || uuidv4().slice(0, 12);
  return `upload-${suffix}@local.invalid`;
}

function makeFallbackName(userId: string, email: string | null, name?: string | null): string {
  const normalizedName = name?.trim();
  if (normalizedName) return normalizedName;
  if (email) return email.split("@")[0] || `Uploader ${userId.slice(0, 8)}`;
  return `Uploader ${userId.slice(0, 8)}`;
}

async function resolveUploadedByUserId(
  preferredUserId: string,
  uploader?: {
    email?: string | null;
    name?: string | null;
  },
): Promise<string> {
  const [existingById] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, preferredUserId))
    .limit(1);

  if (existingById) return existingById.id;

  const normalizedEmail = normalizeEmail(uploader?.email);
  if (normalizedEmail) {
    const [existingByEmail] = await db
      .select({ id: user.id })
      .from(user)
      .where(ilike(user.email, normalizedEmail))
      .limit(1);

    if (existingByEmail) return existingByEmail.id;
  }

  const fallbackEmail = normalizedEmail || makeFallbackEmail(preferredUserId);
  const fallbackName = makeFallbackName(preferredUserId, normalizedEmail, uploader?.name);

  try {
    await db.insert(user).values({
      id: preferredUserId,
      name: fallbackName,
      email: fallbackEmail,
      role: "traveler",
      status: "active",
    });
    return preferredUserId;
  } catch {
    const [insertedOrExisting] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(ilike(user.email, fallbackEmail), eq(user.status, "active")))
      .limit(1);

    if (insertedOrExisting) return insertedOrExisting.id;

    const [anyByEmail] = await db
      .select({ id: user.id })
      .from(user)
      .where(ilike(user.email, fallbackEmail))
      .limit(1);

    if (anyByEmail) return anyByEmail.id;

    throw new Error("Unable to resolve uploader user for file upload");
  }
}
