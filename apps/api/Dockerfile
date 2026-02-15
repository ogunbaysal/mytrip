# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> api  #
############################
FROM oven/bun:1.2.18 AS prune
WORKDIR /repo
COPY . .
RUN bunx turbo prune --scope=api --docker

#########################################
# 2) Install deps in pruned workspace    #
#########################################
FROM oven/bun:1.2.18 AS deps
WORKDIR /app

COPY --from=prune /repo/out/json/ ./
COPY --from=prune /repo/out/bun.lockb ./bun.lockb

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build                               #
#########################################
FROM oven/bun:1.2.18 AS build
WORKDIR /app
ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules

# Build only api (outputs apps/api/dist/index.js)
RUN --mount=type=cache,target=/app/.turbo \
    bunx turbo run build --filter=api

#########################################
# 4) Runtime                             #
#########################################
FROM oven/bun:1.2.18 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

# Copy only runtime artifacts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# If your runtime reads files from src (e.g., migrations, templates),
# copy only what you actually need. Uncomment if required:
# COPY --from=build /app/apps/api/src ./apps/api/src

# Bun needs node_modules at runtime for dynamic imports or non-bundled deps.
# Even though bun build bundles most things, keeping node_modules avoids surprises
# (drizzle, aws sdk parts, etc).
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3002

# Serve compiled output
CMD ["bun", "apps/api/dist/index.js"]
