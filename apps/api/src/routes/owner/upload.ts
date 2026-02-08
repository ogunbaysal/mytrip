import { Hono } from "hono";
import { getSessionFromRequest } from "../../lib/session.ts";
import { processFileUpload } from "../../lib/upload-service.ts";

const app = new Hono();

// Single file upload
app.post("/", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.parseBody();
    const fileData = body["file"];
    const usage = (body["usage"] as string) || "other";

    if (!fileData || typeof fileData === "string") {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const result = await processFileUpload(
      fileData,
      session.user.id,
      {
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
      usage,
    );

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

      const result = await processFileUpload(
        fileData,
        session.user.id,
        {
          email: session.user.email ?? null,
          name: session.user.name ?? null,
        },
        usage,
      );
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
