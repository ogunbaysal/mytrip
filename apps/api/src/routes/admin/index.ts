import { Hono } from "hono";
import { adminAuth } from "../../middleware/admin-auth.ts";
import { authRoutes } from "./auth.ts";
import { usersRoutes } from "./users.ts";
import { placesRoutes } from "./places.ts";
import { bookingsRoutes } from "./bookings.ts";
import { collectionsRoutes } from "./collections.ts";
import { blogRoutes } from "./blog.ts";
import { reviewsRoutes } from "./reviews.ts";
import { analyticsRoutes } from "./analytics.ts";
import { uploadRoutes } from "./upload.ts";
import settings from "./settings.ts";
import categories from "./categories.ts";
import { plansRoutes } from "./plans.ts";
import { subscriptionsRoutes } from "./subscriptions.ts";
import { paymentsRoutes } from "./payments.ts";
import { approvalsRoutes } from "./approvals/places.ts";
import { businessApprovalRoutes } from "./approvals/business.ts";

const app = new Hono<{
  Variables: {
    adminUser: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}>();

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
app.route("/upload", uploadRoutes);
app.route("/settings", settings);
app.route("/categories", categories);
app.route("/plans", plansRoutes);
app.route("/subscriptions", subscriptionsRoutes);
app.route("/payments", paymentsRoutes);
app.route("/approvals/places", approvalsRoutes);
app.route("/approvals/business", businessApprovalRoutes);

export { app as adminRoutes };
