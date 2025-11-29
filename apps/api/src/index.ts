import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono()

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [
    "http://localhost:3000",
    "http://localhost:3002",
]

app.use("*", cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-API-Key", "Authorization"],
}))


app.get("/", (c) => c.text("API is running"))
app.get("/health", (c) => c.json({ status: "ok" }))




const port = Number(process.env.PORT ?? 3002)

Bun.serve({
    port,
    fetch: app.fetch,
})

console.log(`API server listening on http://localhost:${port}`)
