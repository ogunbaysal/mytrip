import { Hono } from "hono";
import { adminAuth } from "../../middleware/admin-auth";
import { authRoutes } from "./auth";
import { usersRoutes } from "./users";
import { placesRoutes } from "./places";
import { bookingsRoutes } from "./bookings";
import { collectionsRoutes } from "./collections";
import { blogRoutes } from "./blog";
import { reviewsRoutes } from "./reviews";
import { analyticsRoutes } from "./analytics";

const app = new Hono();

// Apply admin authentication to all admin routes
app.use("/*", adminAuth);

// Health check for admin panel
app.get("/", (c) => {
  const user = c.get("adminUser");
  return c.json({
    status: "ok",
    message: "Admin API is running",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Route groups
app.route("/auth", authRoutes);
app.route("/users", usersRoutes);
app.route("/places", placesRoutes);
app.route("/bookings", bookingsRoutes);
app.route("/collections", collectionsRoutes);
app.route("/blog", blogRoutes);
app.route("/reviews", reviewsRoutes);
app.route("/analytics", analyticsRoutes);

export { app as adminRoutes };