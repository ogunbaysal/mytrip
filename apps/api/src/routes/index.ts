import { Hono } from "hono";
import { placesRoutes } from "./places.ts";
import { collectionsRoutes } from "./collections.ts";
import { blogRoutes } from "./blog.ts";
import { reviewsRoutes } from "./reviews.ts";
import { searchRoutes } from "./search.ts";

const app = new Hono();

// API information
app.get("/", (c) => {
  return c.json({
    name: "TatilDesen API",
    version: "1.0.0",
    description: "Travel booking and discovery API for Muğla, Türkiye",
    endpoints: {
      places: "/places",
      collections: "/collections",
      blog: "/blog",
      reviews: "/reviews",
      search: "/search",
      auth: "/auth",
      admin: "/admin",
    },
    documentation: {
      github: "https://github.com/your-repo/mytrip",
      api_docs: "/docs",
    },
  });
});

// Route registration
app.route("/places", placesRoutes);
app.route("/collections", collectionsRoutes);
app.route("/blog", blogRoutes);
app.route("/reviews", reviewsRoutes);
app.route("/search", searchRoutes);

export { app as routes };
