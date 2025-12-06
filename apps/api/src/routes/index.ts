import { Hono } from "hono";
import { placesRoutes } from "./places";
import { collectionsRoutes } from "./collections";
import { blogRoutes } from "./blog";
import { reviewsRoutes } from "./reviews";
import { searchRoutes } from "./search";

const app = new Hono();

// API information
app.get("/", (c) => {
  return c.json({
    name: "MyTrip API",
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