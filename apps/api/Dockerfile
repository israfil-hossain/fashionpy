# syntax=docker/dockerfile:1
FROM oven/bun:1.4 AS builder
WORKDIR /app

# Native build toolchain for node modules that compile at install time.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY . .

RUN bun install --frozen-lockfile

# Build the workspace packages (core, dashboard libs, panel packages).
# The app shells whose builds need build-time env are built separately below.
# Streamed logs + capped concurrency keep the build stable on small VMs.
ENV TURBO_UI=stream
RUN bunx turbo run build --concurrency=2 \
  --filter='!@mercurjs/storefront' \
  --filter='!@acme/admin' \
  --filter='!@acme/vendor'

# Panels bake their backend origin at build time and must emit assets relative
# to the sub-path the backend serves them under (/dashboard, /seller).
ARG MERCUR_BACKEND_URL
RUN MERCUR_BACKEND_URL="$MERCUR_BACKEND_URL" VITE_BASE_PATH=/dashboard/ \
  bun run --filter=@acme/admin build
RUN MERCUR_BACKEND_URL="$MERCUR_BACKEND_URL" VITE_BASE_PATH=/seller/ \
  bun run --filter=@acme/vendor build

# Build the Medusa backend → apps/api/.medusa/server
RUN cd apps/api && bunx medusa build

FROM oven/bun:1.4 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

# Panels are served by the admin-ui / vendor-ui modules from these directories.
ENV ADMIN_UI_APP_DIR=/app/apps/admin-test \
    VENDOR_UI_APP_DIR=/app/apps/vendor \
    DASHBOARDS_SERVE=true \
    PORT=9000

EXPOSE 9000
WORKDIR /app/apps/api
CMD ["sh", "-c", "bunx medusa db:migrate && bunx medusa start"]
