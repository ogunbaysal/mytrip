# syntax=docker/dockerfile:1.6

FROM oven/bun:1.2.22 AS prune
WORKDIR /repo
COPY . .
RUN bunx turbo prune --scope=api --docker

FROM oven/bun:1.2.22 AS deps
WORKDIR /app

# 1) pruned package.json files
COPY --from=prune /repo/out/json/ ./

# 2) IMPORTANT: copy the pruned lockfile (NOT the root lockfile)
# turbo prune usually writes it to /repo/out/bun.lock
COPY --from=prune /repo/out/bun.lock ./bun.lock

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

FROM oven/bun:1.2.22 AS build
WORKDIR /app
ENV NODE_ENV=production
ENV TURBO_TELEMETRY_DISABLED=1

COPY --from=prune /repo/out/full/ ./
COPY --from=deps /app/node_modules ./node_modules

RUN --mount=type=cache,target=/app/.turbo \
    bunx turbo run build --filter=api

FROM oven/bun:1.2.22 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=deps  /app/node_modules ./node_modules

EXPOSE 3002
CMD ["bun", "apps/api/dist/index.js"]
