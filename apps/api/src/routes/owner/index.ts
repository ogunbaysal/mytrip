import { Hono } from "hono";
import { placesRoutes } from "./places.ts";
import { blogsRoutes } from "./blogs.ts";

const app = new Hono();

app.route("/places", placesRoutes);
app.route("/blogs", blogsRoutes);

export { app as ownerRoutes };
