import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";

const app = new Hono();

app.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || typeof file === "string") {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const extension = file.name?.split(".").pop();
    const filename = `${uuidv4()}.${extension}`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const uploadsDir = join(__dirname, "../../../public/uploads");
    const path = join(uploadsDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    await writeFile(path, buffer);

    // Get the base URL from the request or env
    // Since we are serving /uploads from root, the URL is just /uploads/filename
    const url = `${process.env.API_URL || "http://localhost:3002"}/uploads/${filename}`;

    return c.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

export { app as uploadRoutes };
