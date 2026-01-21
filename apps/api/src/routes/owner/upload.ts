import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { getSessionFromRequest } from "../../lib/session.ts";
import { db } from "../../db/index.ts";
import { file } from "../../db/schemas/index.ts";

const app = new Hono();

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), "apps/api/public/uploads");

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
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(fileData.type)) {
    return {
      error: `Invalid file type: ${fileData.type}. Allowed: jpg, png, webp, gif`,
    };
  }

  // Validate file size
  if (fileData.size > MAX_FILE_SIZE) {
    return { error: `File too large. Maximum size is 5MB` };
  }

  const extension = fileData.name?.split(".").pop()?.toLowerCase() || "jpg";
  const storedFilename = `${uuidv4()}.${extension}`;
  const path = join(uploadsDir, storedFilename);

  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await writeFile(path, buffer);

  // Store only the filename in the database (not the full URL)
  const fileId = uuidv4();
  await db.insert(file).values({
    id: fileId,
    filename: fileData.name || storedFilename,
    storedFilename,
    url: storedFilename, // Store only the filename
    mimeType: fileData.type,
    size: fileData.size,
    type: getFileType(fileData.type),
    usage: usage as any,
    uploadedById: userId,
  });

  // Return full URL for immediate use by the client
  const fullUrl = `${process.env.API_URL || "http://localhost:3002"}/uploads/${storedFilename}`;
  return { url: fullUrl, fileId };
}

// Single file upload
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

// Multiple file upload
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

    // Handle both single file and array of files
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
