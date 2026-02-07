import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.ts";
import {
  blogCategory,
  blogComment,
  blogImage,
  file,
} from "../db/schemas/index.ts";
import { resolvePublicFileUrl } from "./place-relations.ts";

export function parseJsonStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item).trim())
      .filter(Boolean);
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function serializeJsonStringArray(value: unknown): string {
  return JSON.stringify(parseJsonStringArray(value));
}

export function normalizeSlug(value: string): string {
  const turkishMap: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };

  return value
    .trim()
    .split("")
    .map((char) => turkishMap[char] ?? char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function estimateReadTimeMinutes(html: string): number {
  const plainText = (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plainText) return 1;

  const words = plainText.split(" ").length;
  return Math.max(1, Math.ceil(words / 220));
}

function extractStoredFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;

  if (normalized.includes("/uploads/")) {
    return normalized.split("/uploads/").pop() ?? "";
  }

  if (normalized.includes("/")) {
    return normalized.split("/").pop() ?? "";
  }

  return normalized;
}

async function resolveFileIdsFromRefs(refs: string[]): Promise<string[]> {
  if (refs.length === 0) return [];

  const normalizedRefs = refs.map((item) => item.trim()).filter(Boolean);
  const filenameRefs = normalizedRefs.map(extractStoredFilename).filter(Boolean);
  const candidates = Array.from(new Set([...normalizedRefs, ...filenameRefs]));

  if (candidates.length === 0) return [];

  const rows = await db
    .select({
      id: file.id,
      url: file.url,
      storedFilename: file.storedFilename,
    })
    .from(file)
    .where(
      or(
        inArray(file.id, candidates),
        inArray(file.url, candidates),
        inArray(file.storedFilename, candidates),
      ),
    );

  const idsInOrder: string[] = [];
  const seen = new Set<string>();

  for (const ref of normalizedRefs) {
    const filename = extractStoredFilename(ref);
    const match =
      rows.find((row) => row.id === ref) ||
      rows.find((row) => row.url === ref) ||
      rows.find((row) => row.storedFilename === ref) ||
      rows.find((row) => row.url === filename) ||
      rows.find((row) => row.storedFilename === filename);

    if (!match || seen.has(match.id)) continue;
    seen.add(match.id);
    idsInOrder.push(match.id);
  }

  return idsInOrder;
}

export async function resolveSingleFileId(value: unknown): Promise<string | null> {
  if (!value || typeof value !== "string") return null;
  const ids = await resolveFileIdsFromRefs([value]);
  return ids[0] ?? null;
}

export async function syncBlogImages(
  blogId: string,
  imageRefs: unknown,
): Promise<string[]> {
  const refs = parseJsonStringArray(imageRefs);
  const fileIds = await resolveFileIdsFromRefs(refs);

  await db.delete(blogImage).where(eq(blogImage.blogId, blogId));

  if (fileIds.length > 0) {
    await db.insert(blogImage).values(
      fileIds.map((fileId, index) => ({
        blogId,
        fileId,
        sortOrder: index,
      })),
    );
  }

  return fileIds;
}

export async function getBlogImagesMap(
  blogIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (blogIds.length === 0) return map;

  const rows = await db
    .select({
      blogId: blogImage.blogId,
      url: file.url,
    })
    .from(blogImage)
    .innerJoin(file, eq(blogImage.fileId, file.id))
    .where(inArray(blogImage.blogId, blogIds))
    .orderBy(asc(blogImage.blogId), asc(blogImage.sortOrder));

  for (const row of rows) {
    const current = map.get(row.blogId) ?? [];
    current.push(resolvePublicFileUrl(row.url));
    map.set(row.blogId, current);
  }

  return map;
}

export async function getBlogImageFileIdsMap(
  blogIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (blogIds.length === 0) return map;

  const rows = await db
    .select({
      blogId: blogImage.blogId,
      fileId: blogImage.fileId,
    })
    .from(blogImage)
    .where(inArray(blogImage.blogId, blogIds))
    .orderBy(asc(blogImage.blogId), asc(blogImage.sortOrder));

  for (const row of rows) {
    const current = map.get(row.blogId) ?? [];
    current.push(row.fileId);
    map.set(row.blogId, current);
  }

  return map;
}

export async function getBlogCommentCountMap(
  blogIds: string[],
  status: "pending" | "published" | "rejected" | "spam" | "all" = "all",
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (blogIds.length === 0) return map;

  const whereClause =
    status === "all"
      ? inArray(blogComment.blogId, blogIds)
      : and(
          inArray(blogComment.blogId, blogIds),
          eq(blogComment.status, status),
        );

  const rows = await db
    .select({
      blogId: blogComment.blogId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(blogComment)
    .where(whereClause)
    .groupBy(blogComment.blogId);

  for (const row of rows) {
    map.set(row.blogId, Number(row.count));
  }

  return map;
}

export async function resolveBlogCategoryId(input: {
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
}): Promise<string | null> {
  if (input.categoryId) {
    const [row] = await db
      .select({ id: blogCategory.id })
      .from(blogCategory)
      .where(eq(blogCategory.id, input.categoryId))
      .limit(1);
    if (row) return row.id;
  }

  if (input.categorySlug) {
    const [row] = await db
      .select({ id: blogCategory.id })
      .from(blogCategory)
      .where(eq(blogCategory.slug, input.categorySlug))
      .limit(1);
    if (row) return row.id;
  }

  if (input.categoryName) {
    const slug = normalizeSlug(input.categoryName);
    if (!slug) return null;

    const [row] = await db
      .select({ id: blogCategory.id })
      .from(blogCategory)
      .where(eq(blogCategory.slug, slug))
      .limit(1);
    if (row) return row.id;
  }

  return null;
}

export function withDefaultPublishedAt(input: {
  status?: string;
  publishedAt?: Date | null;
}): Date | null | undefined {
  if (input.status !== "published") return input.publishedAt;
  return input.publishedAt ?? new Date();
}

export function makeUniqueSlug(title: string): string {
  const base = normalizeSlug(title) || "blog-yazisi";
  return `${base}-${nanoid(6)}`;
}
