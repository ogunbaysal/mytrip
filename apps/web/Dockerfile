# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> web #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

ENV TURBO_TELEMETRY_DISABLED=1

COPY . .

# Create pruned repo for apps/web
RUN --mount=type=cache,target=/root/.bun \
    bunx turbo prune --scope=web --docker

# Make sure the pruned lockfile exists (fail fast if not)
RUN test -f /repo/out/bun.lock || (echo "ERROR: turbo prune did not produce /repo/out/bun.lock" && exit 1)

# Also place it in out/json so bun install can use it reliably
RUN cp -f /repo/out/bun.lock /repo/out/json/bun.lock


#########################################
# 2) Build                              #
#########################################
FROM oven/bun:1.2.22 AS build
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

# Toolchain (safe for native deps if any appear)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy pruned manifests + lockfile and install dependencies
COPY --from=prune /repo/out/json/ ./
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

# Copy full pruned source
COPY --from=prune /repo/out/full/ ./

# IMPORTANT: put lockfile where turbo expects it
COPY --from=prune /repo/out/bun.lock /app/bun.lock

# Build web
RUN --mount=type=cache,target=/app/.turbo \
    bunx turbo run build --filter=web


#########################################
# 3) Runtime                            #
#########################################
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy standalone server bundle with traced runtime dependencies
COPY --from=build /app/apps/web/.next/standalone ./
# Next requires static assets to be copied separately in standalone mode
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
