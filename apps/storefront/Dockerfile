# syntax=docker/dockerfile:1
FROM oven/bun:1.4 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY . .

RUN bun install --frozen-lockfile

# NEXT_PUBLIC_* vars are inlined into the bundle at build time and must be
# provided as build args. Server-side vars are passed through as well so any
# page rendered during `next build` can reach the backend.
ARG MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=bd
ARG NEXT_PUBLIC_SITE_NAME="FashionPy"
ARG NEXT_PUBLIC_SITE_DESCRIPTION="FashionPy - Your marketplace for fashion, beauty and lifestyle products"
ARG NEXT_PUBLIC_VENDOR_URL
ARG NEXT_PUBLIC_STRIPE_KEY
ARG REVALIDATE_SECRET

ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_SITE_DESCRIPTION=$NEXT_PUBLIC_SITE_DESCRIPTION \
    NEXT_PUBLIC_VENDOR_URL=$NEXT_PUBLIC_VENDOR_URL \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    REVALIDATE_SECRET=$REVALIDATE_SECRET

RUN cd apps/storefront && bun run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next standalone output keeps the app under apps/storefront; static assets and
# public files are not traced automatically and must be copied in.
COPY --from=builder /app/apps/storefront/.next/standalone ./
COPY --from=builder /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=builder /app/apps/storefront/public ./apps/storefront/public

EXPOSE 3000
CMD ["node", "apps/storefront/server.js"]
