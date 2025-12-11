import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { adminRoutes } from "./routes/admin";
import { routes } from "./routes";
import { locationsRoutes } from "./routes/locations";

import { serveStatic } from "hono/bun";

const app = new Hono()

app.use("/uploads/*", serveStatic({ root: "./apps/api/public" }));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

app.use("*", cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-API-Key", "Authorization"],
}))

// Better Auth routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
});

// API health check and info
app.get("/", (c) => c.text("API is running"))
app.get("/health", (c) => c.json({ status: "ok" }))
app.get("/api", (c) => c.json({
    name: "MyTrip API",
    version: "1.0.0",
    status: "running",
    endpoints: {
        public: "/api",
        auth: "/api/auth",
        admin: "/api/admin",
        places: "/api/places",
        collections: "/api/collections",
        blog: "/api/blog",
        reviews: "/api/reviews",
        search: "/api/search",
    },
    documentation: "https://github.com/your-repo/mytrip",
}))

// Public API routes
app.route("/api", routes)

// Admin routes
app.route("/api/admin", adminRoutes)

// Locations routes
app.route("/api/locations", locationsRoutes)


export default app;