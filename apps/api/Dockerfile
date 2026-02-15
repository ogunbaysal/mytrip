# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> api  #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

# Copy full monorepo
COPY . .

# Produce pruned workspace for apps/api
# (uses repo-installed turbo if present; otherwise bunx downloads)
RUN bunx turbo prune --scope=api --docker

#########################################
# 2) Install deps in pruned workspace    #
#########################################
FROM oven/bun:1.2.22 AS deps
WORKDIR /app

# Native build toolchain needed for packages like better-sqlite3
# + node-gyp to satisfy install scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
    sqlite3 libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN bun add -g node-gyp

# Copy pruned package manifests
COPY --from=prune /repo/out/json/ ./

# Copy the lockfile that turbo prune generated (Bun text lockfile)
COPY --from=prune /repo/out/bun.lock ./bun.lock

# Force native modules to compile inside the container (avoids ABI/V8 symbol mismatch)
ENV npm_config_build_from_source=true

# Install dependencies
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build                               #
#########################################
FROM oven/bun:1.2.22 AS build
WORKDIR /app

ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

# Copy full pruned source + installed deps
COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules

# Build only the api app
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

# Copy built output + runtime deps
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=deps  /app/node_modules ./node_modules

EXPOSE 3002
CMD ["bun", "apps/api/dist/index.js"]
