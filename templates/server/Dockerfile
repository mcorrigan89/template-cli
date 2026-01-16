# Multi-stage build for Hono server application
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
WORKDIR /app/apps/server
RUN pnpm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Install pnpm and production dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first
COPY --chown=appuser:nodejs pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --from=build --chown=appuser:nodejs /app/apps/server/package.json ./apps/server/
COPY --from=build --chown=appuser:nodejs /app/packages ./packages

# Install production dependencies only
ENV CI=true
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=build --chown=appuser:nodejs /app/apps/server/dist ./apps/server/dist

USER appuser

# Expose port
EXPOSE 3001

# Start the application
WORKDIR /app/apps/server
CMD ["node", "dist/index.js"]
