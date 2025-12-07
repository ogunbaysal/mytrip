import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";

const app = new Hono();

app.post("/", async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body["file"];

        if (!file || typeof file === 'string') {
            return c.json({ error: "No file uploaded" }, 400);
        }

        const extension = file.name?.split(".").pop();
        const filename = `${uuidv4()}.${extension}`;
        const path = join(process.cwd(), "apps/api/public/uploads", filename);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        await Bun.write(path, buffer);

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
