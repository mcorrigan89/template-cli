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

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first
COPY --chown=appuser:nodejs pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --from=deps --chown=appuser:nodejs /app/apps/server/package.json ./apps/server/
COPY --from=deps --chown=appuser:nodejs /app/packages ./packages

# Install production dependencies
ENV CI=true
RUN pnpm install --prod --frozen-lockfile

# Copy source files
COPY --from=deps --chown=appuser:nodejs /app/apps/server/src ./apps/server/src
COPY --from=deps --chown=appuser:nodejs /app/apps/server/tsconfig.json ./apps/server/

USER appuser

# Expose port
EXPOSE 3001

# Start the application with tsx
WORKDIR /app/apps/server
CMD ["pnpm", "start"]
