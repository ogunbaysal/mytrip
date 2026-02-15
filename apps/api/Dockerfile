# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> api #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

COPY . .

# Create pruned repo for apps/api
RUN bunx turbo prune --scope=api --docker

#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM oven/bun:1.2.22 AS deps
WORKDIR /app

# Toolchain for native deps (better-sqlite3) + node-gyp availability
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    pkg-config \
    sqlite3 \
    libsqlite3-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Ensure node-gyp is on PATH (via npm global bin)
RUN npm i -g node-gyp

# Copy pruned package manifests/workspace
COPY --from=prune /repo/out/json/ ./

# Use the lockfile turbo produced (bun text lockfile)
COPY --from=prune /repo/out/bun.lock ./bun.lock

# Force native rebuild in-container (avoids ABI/V8 mismatch from any prebuilt artifacts)
ENV npm_config_build_from_source=true
ENV NODE_ENV=development

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build                              #
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
# 4) Runtime                            #
#########################################
FROM oven/bun:1.2.22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

# Optional: tini-like signal handling is okay without, but bun handles SIGTERM fine in most setups.
# If you want tini, you can apt-get install tini here.

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=deps  /app/node_modules ./node_modules

EXPOSE 3002
CMD ["bun", "apps/api/dist/index.js"]
