# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> web #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

# Optional build args injected by Coolify
ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

COPY . .

# Create pruned repo for apps/web
# Turbo will generate /repo/out/full, /repo/out/json and usually /repo/out/bun.lock
RUN bunx turbo prune --scope=web --docker

# Ensure the pruned lockfile is available in /repo/out/json as well
# (DO NOT overwrite /repo/out/bun.lock with /repo/bun.lock)
RUN if [ -f /repo/out/bun.lock ]; then \
    cp -f /repo/out/bun.lock /repo/out/json/bun.lock; \
    elif [ -f /repo/bun.lock ]; then \
    cp -f /repo/bun.lock /repo/out/bun.lock && cp -f /repo/bun.lock /repo/out/json/bun.lock; \
    else \
    echo "ERROR: No bun.lock found in repo root or turbo prune output." && exit 1; \
    fi


#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM oven/bun:1.2.22 AS deps
WORKDIR /app

# Toolchain (safe; covers native deps if they appear)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy pruned package manifests/workspace + lockfile
COPY --from=prune /repo/out/json/ ./

# Deterministic install
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile


#########################################
# 3) Build                              #
#########################################
FROM oven/bun:1.2.22 AS build
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

COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0", "apps/web"]
