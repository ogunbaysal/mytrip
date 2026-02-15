import { Hono } from "hono";
import { processFileUpload } from "../../lib/upload-service.ts";
import { getAdminUserFromContext } from "../../lib/admin-context.ts";

const app = new Hono();

app.post("/", async (c) => {
  try {
    const adminUser = getAdminUserFromContext(c);
    if (!adminUser?.id) {
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
      adminUser.id,
      {
        email: adminUser.email ?? null,
        name: adminUser.name ?? null,
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

app.post("/multiple", async (c) => {
  try {
    const adminUser = getAdminUserFromContext(c);
    if (!adminUser?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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

      const result = await processFileUpload(
        fileData,
        adminUser.id,
        {
          email: adminUser.email ?? null,
          name: adminUser.name ?? null,
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
