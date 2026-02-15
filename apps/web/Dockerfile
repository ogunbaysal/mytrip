# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> web #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

COPY . .

# Create pruned repo for apps/web
RUN bunx turbo prune --scope=web --docker

# Make sure the pruned lockfile exists (fail fast if not)
RUN test -f /repo/out/bun.lock || (echo "ERROR: turbo prune did not produce /repo/out/bun.lock" && exit 1)

# Also place it in out/json so bun install can use it reliably
RUN cp -f /repo/out/bun.lock /repo/out/json/bun.lock


#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM oven/bun:1.2.22 AS deps
WORKDIR /app

# Toolchain (safe for native deps if any appear)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy pruned manifests + lockfile
COPY --from=prune /repo/out/json/ ./

# Deterministic install
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile


#########################################
# 3) Build                              #
#########################################
FROM oven/bun:1.2.22 AS build
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

# Copy full pruned source
COPY --from=prune /repo/out/full/ ./

# IMPORTANT: put lockfile where turbo expects it
COPY --from=prune /repo/out/bun.lock /app/bun.lock

# Bring node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Build web
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
