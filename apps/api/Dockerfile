# syntax=docker/dockerfile:1.6

############################
# 1) Prune monorepo -> api  #
############################
FROM oven/bun:1.2.18 AS prune
WORKDIR /repo
COPY . .
# Ensure turbo exists consistently (recommended)
# If turbo is already in your repo root devDependencies, this will use it.
RUN bunx turbo prune --scope=api --docker

#########################################
# 2) Install deps in pruned workspace    #
#########################################
FROM oven/bun:1.2.18 AS deps
WORKDIR /app

# Copy pruned package manifests
COPY --from=prune /repo/out/json/ ./

# Copy lockfile from wherever turbo prune placed it (bun.lockb or bun.lock)
# Some setups place lockfile under out/json/, others at out/.
# We'll try both without failing.
RUN set -eux; \
    if [ -f /repo/out/bun.lockb ]; then echo "using /repo/out/bun.lockb"; fi

# Best-effort copies (no error if missing)
COPY --from=prune /repo/out/bun.lockb ./bun.lockb
COPY --from=prune /repo/out/json/bun.lockb ./bun.lockb
COPY --from=prune /repo/out/bun.lock ./bun.lock
COPY --from=prune /repo/out/json/bun.lock ./bun.lock

# Install
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

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=deps  /app/node_modules ./node_modules

EXPOSE 3002
CMD ["bun", "apps/api/dist/index.js"]
