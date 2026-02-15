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

COPY . .

# Create pruned repo for apps/web
RUN bunx turbo prune --scope=web --docker

# Ensure bun.lock is available where later stages copy it from
RUN test -f /repo/bun.lock && \
    cp -f /repo/bun.lock /repo/out/bun.lock && \
    mkdir -p /repo/out/json && \
    cp -f /repo/bun.lock /repo/out/json/bun.lock


#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM oven/bun:1.2.18 AS deps
WORKDIR /app

# Native build toolchain (covers sharp / optional native deps if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy pruned package manifests/workspace
COPY --from=prune /repo/out/json/ ./

# Use the lockfile turbo produced
COPY --from=prune /repo/out/bun.lock ./bun.lock

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile


#########################################
# 3) Build                              #
#########################################
FROM oven/bun:1.2.18 AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/bun.lock ./bun.lock

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

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0", "apps/web"]
