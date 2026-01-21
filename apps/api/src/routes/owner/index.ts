import { Hono } from "hono";
import { placesRoutes } from "./places.ts";
import { blogsRoutes } from "./blogs.ts";
import { uploadRoutes } from "./upload.ts";

const app = new Hono();

app.route("/places", placesRoutes);
app.route("/blogs", blogsRoutes);
app.route("/upload", uploadRoutes);

export { app as ownerRoutes };
