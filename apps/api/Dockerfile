# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> api #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

# Coolify injects build args; safe to declare so Docker doesn't warn
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

ARG ALLOWED_ORIGINS
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG CI
ARG COOKIE_DOMAIN
ARG DATABASE_URL
ARG MINIO_ACCESS_KEY
ARG MINIO_BUCKET
ARG MINIO_ENDPOINT
ARG MINIO_FORCE_PATH_STYLE
ARG MINIO_PUBLIC_BASE_URL
ARG MINIO_REGION
ARG MINIO_SECRET_KEY
ARG PGPOOL_CONN_TIMEOUT_MS
ARG PGPOOL_IDLE_MS
ARG PGPOOL_MAX
ARG PORT

COPY . .

# You have turbo in root devDependencies, so bunx will use that version predictably
RUN bunx turbo prune --scope=api --docker


#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM oven/bun:1.2.22 AS deps
WORKDIR /app

# Pruned manifests
COPY --from=prune /repo/out/json/ ./

# ✅ Always use the ROOT bun.lock (exists in your repo)
COPY --from=prune /repo/bun.lock ./bun.lock

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile


#########################################
# 3) Build                               #
#########################################
FROM oven/bun:1.2.22 AS build
WORKDIR /app

ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules

RUN --mount=type=cache,target=/app/.turbo \
    bunx turbo run build --filter=api


#########################################
# 4) Runtime                             #
#########################################
FROM oven/bun:1.2.22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=deps  /app/node_modules ./node_modules

EXPOSE 3002
CMD ["bun", "apps/api/dist/index.js"]
