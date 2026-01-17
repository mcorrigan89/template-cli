# Multi-stage build for TanStack Start web application
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Dependencies stage
FROM base AS deps
ENV CI=true
COPY . .
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=deps /app /app
WORKDIR /app/apps/web
RUN pnpm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built application (.output directory from TanStack Start)
COPY --from=build --chown=appuser:nodejs /app/apps/web/.output ./.output
COPY --from=build --chown=appuser:nodejs /app/apps/web/package.json ./package.json
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
