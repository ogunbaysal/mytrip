# syntax=docker/dockerfile:1.6

############################################
# Base: Node 22 (real node) + Bun installed
############################################
FROM node:22-bookworm-slim AS base

ARG BUN_VERSION=1.2.18

# Make bun install location explicit and persistent
ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl unzip xz-utils git \
    python3 make g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install bun into $BUN_INSTALL (no reliance on .bashrc)
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}" \
    && bun --version

############################
# 1) Prune monorepo -> web #
############################
FROM base AS prune
WORKDIR /repo

ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

COPY . .

RUN bunx turbo prune --scope=web --docker

# Make sure lockfile exists in pruned outputs (for frozen installs)
RUN test -f /repo/bun.lock && \
    cp -f /repo/bun.lock /repo/out/bun.lock && \
    mkdir -p /repo/out/json && \
    cp -f /repo/bun.lock /repo/out/json/bun.lock

#########################################
# 2) Install deps in pruned workspace   #
#########################################
FROM base AS deps
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID

COPY --from=prune /repo/out/json/ ./
COPY --from=prune /repo/out/bun.lock ./bun.lock

RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

#########################################
# 3) Build                              #
#########################################
FROM base AS build
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
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=deps  /app/bun.lock ./bun.lock

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
