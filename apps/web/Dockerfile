# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> web #
############################
FROM oven/bun:1.2.18 AS prune
WORKDIR /repo

# Optional build args injected by Coolify
ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

# Copy entire repo (prune step needs it)
COPY . .

# Create a pruned workspace suitable for Docker builds
# Outputs: /repo/out/json and /repo/out/full (and lockfile inside out/json when present)
RUN bunx turbo prune --scope=web --docker

#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM oven/bun:1.2.18 AS deps
WORKDIR /app

# Optional build args injected by Coolify
ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

# Copy package metadata (includes lockfile when turbo emits it there)
COPY --from=prune /repo/out/json/ ./

# Deterministic install (will use lockfile from out/json if present)
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build                              #
#########################################
FROM oven/bun:1.2.18 AS build
WORKDIR /app

# Optional build args injected by Coolify
ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

# Full pruned source + node_modules from deps stage
COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules

# Build only web (and its deps, if any)
RUN --mount=type=cache,target=/app/.turbo \
    bunx turbo run build --filter=web

#########################################
# 4) Runtime                            #
#########################################
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy only what runtime needs
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

# Run Next in production
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0", "apps/web"]
