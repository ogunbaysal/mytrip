import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

for (const path of ["../../.env.local", "../../.env", ".env.local", ".env"]) {
  config({ path })
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Create a .env file (see .env.example) before running Drizzle commands."
  )
}

export default defineConfig({
  schema: "./src/db/schemas",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
})
