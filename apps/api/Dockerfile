# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> api #
############################
FROM oven/bun:1.2.22 AS prune
WORKDIR /repo

ENV TURBO_TELEMETRY_DISABLED=1

COPY . .

# Create pruned repo for apps/api
RUN --mount=type=cache,target=/root/.bun \
    bunx turbo prune --scope=api --docker

# Ensure the pruned lockfile exists
RUN test -f /repo/out/bun.lock || (echo "ERROR: turbo prune did not produce /repo/out/bun.lock" && exit 1)

#########################################
# 2) Build                              #
#########################################
FROM oven/bun:1.2.22 AS build
WORKDIR /app

ENV NODE_ENV=production

# Install runtime deps in the pruned workspace.
# API build uses `bun build` and outputs a bundled dist artifact.
COPY --from=prune /repo/out/json/ ./
COPY --from=prune /repo/out/bun.lock ./bun.lock
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile --production

COPY --from=prune /repo/out/full/ ./
RUN cd /app/apps/api && bun run build

#########################################
# 3) Runtime                            #
#########################################
FROM oven/bun:1.2.22 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002

COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3002
CMD ["bun", "apps/api/dist/index.js"]
