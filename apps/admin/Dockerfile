# syntax=docker/dockerfile:1.6

#############################
# 1) Prune monorepo -> admin
#############################
FROM oven/bun:1.2.18 AS prune
WORKDIR /repo
COPY . .
RUN bunx turbo prune --scope=admin --docker

#########################################
# 2) Install deps in pruned workspace
#########################################
FROM oven/bun:1.2.18 AS deps
WORKDIR /app

# pruned manifests
COPY --from=prune /repo/out/json/ ./

# lockfile can be in out/json (common) or out (sometimes), and may be bun.lockb or bun.lock
# We try both locations + both names.
COPY --from=prune /repo/out/bun.lockb ./bun.lockb
COPY --from=prune /repo/out/json/bun.lockb ./bun.lockb
COPY --from=prune /repo/out/bun.lock ./bun.lock
COPY --from=prune /repo/out/json/bun.lock ./bun.lock

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build
#########################################
FROM oven/bun:1.2.18 AS build
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules

RUN --mount=type=cache,target=/app/.turbo \
    bunx turbo run build --filter=admin

#########################################
# 4) Runtime
#########################################
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOST=0.0.0.0

# Recommended for Next standalone if you enable it (optional):
# ENV NEXT_SHARP_PATH=/app/node_modules/sharp

COPY --from=build /app/apps/admin/.next ./apps/admin/.next
COPY --from=build /app/apps/admin/public ./apps/admin/public
COPY --from=build /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001", "-H", "0.0.0.0", "apps/admin"]
