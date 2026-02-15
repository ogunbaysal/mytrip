# syntax=docker/dockerfile:1.6

############################################
# Base: Node 22 (real node) + Bun installed
############################################
FROM node:22-bookworm-slim AS base

# Bun version (match your repo)
ARG BUN_VERSION=1.2.18

# System deps: git for prune, build toolchain for native addons
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git \
    python3 make g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
ENV PATH="/root/.bun/bin:${PATH}"

############################
# 1) Prune monorepo -> web #
############################
FROM base AS prune
WORKDIR /repo

# Optional build args injected by Coolify
ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

# Copy entire repo (prune step needs it)
COPY . .

# Turbo prune
RUN bunx turbo prune --scope=web --docker

# Ensure lockfile exists + is available inside pruned workspace for frozen installs
RUN test -f /repo/bun.lock && \
    cp -f /repo/bun.lock /repo/out/bun.lock && \
    mkdir -p /repo/out/json && \
    cp -f /repo/bun.lock /repo/out/json/bun.lock

#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM base AS deps
WORKDIR /app

# Optional build args injected by Coolify
ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

# Copy pruned package manifests + lockfile
COPY --from=prune /repo/out/json/ ./
COPY --from=prune /repo/out/bun.lock ./bun.lock

# Deterministic install
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build                              #
#########################################
FROM base AS build
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

# Full pruned source + deps
COPY --from=prune /repo/out/full/ ./
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=deps  /app/bun.lock ./bun.lock

# Build only web
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

# Copy runtime artifacts
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0", "apps/web"]
