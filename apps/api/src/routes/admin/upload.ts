import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { getSessionFromRequest } from "../../lib/session.ts";
import { db } from "../../db/index.ts";
import { file, user } from "../../db/schemas/index.ts";
import { eq } from "drizzle-orm";

const app = new Hono();

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, "../../../public/uploads");

async function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
}

function getFileType(
  mimeType: string,
): "image" | "document" | "video" | "audio" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return "document";
  return "other";
}

async function processUpload(
  fileData: globalThis.File,
  userId: string,
  usage: string = "other",
): Promise<{ url: string; fileId: string } | { error: string }> {
  const isBusinessDocument = usage === "business_document";
  const allowedTypes = isBusinessDocument
    ? ALLOWED_DOCUMENT_TYPES
    : ALLOWED_IMAGE_TYPES;
  const maxSize = isBusinessDocument ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;

  if (!allowedTypes.includes(fileData.type)) {
    return {
      error: isBusinessDocument
        ? `Invalid file type: ${fileData.type}. Allowed: pdf`
        : `Invalid file type: ${fileData.type}. Allowed: jpg, png, webp, gif`,
    };
  }

  if (fileData.size > maxSize) {
    return {
      error: `File too large. Maximum size is ${Math.round(
        maxSize / 1024 / 1024,
      )}MB`,
    };
  }

  const extension = fileData.name?.split(".").pop()?.toLowerCase() || "jpg";
  const storedFilename = `${uuidv4()}.${extension}`;
  const path = join(uploadsDir, storedFilename);

  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await writeFile(path, buffer);

  const fileId = uuidv4();
  const [matchedUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (matchedUser) {
    await db.insert(file).values({
      id: fileId,
      filename: fileData.name || storedFilename,
      storedFilename,
      url: storedFilename,
      mimeType: fileData.type,
      size: fileData.size,
      type: getFileType(fileData.type),
      usage: usage as any,
      uploadedById: userId,
    });
  }

  const fullUrl = `${process.env.API_URL || "http://localhost:3002"}/uploads/${storedFilename}`;
  return { url: fullUrl, fileId };
}

app.post("/", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await ensureUploadsDir();

    const body = await c.req.parseBody();
    const fileData = body["file"];
    const usage = (body["usage"] as string) || "other";

    if (!fileData || typeof fileData === "string") {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const result = await processUpload(fileData, session.user.id, usage);

    if ("error" in result) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ url: result.url, fileId: result.fileId });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.post("/multiple", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await ensureUploadsDir();

    const body = await c.req.parseBody({ all: true });
    const files = body["files"];
    const usage = (body["usage"] as string) || "other";

    if (!files) {
      return c.json({ error: "No files uploaded" }, 400);
    }

    const fileArray = Array.isArray(files)
      ? files
      : typeof files === "string"
        ? []
        : [files];

    if (fileArray.length === 0) {
      return c.json({ error: "No valid files uploaded" }, 400);
    }

    const results: { url: string; fileId: string }[] = [];
    const errors: string[] = [];

    for (const fileData of fileArray) {
      if (typeof fileData === "string") continue;

      const result = await processUpload(fileData, session.user.id, usage);
      if ("error" in result) {
        errors.push(`${fileData.name}: ${result.error}`);
      } else {
        results.push(result);
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return c.json({ error: errors.join("; ") }, 400);
    }

    return c.json({
      urls: results.map((r) => r.url),
      fileIds: results.map((r) => r.fileId),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

export { app as uploadRoutes };
