# ---- deps ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Enable pnpm (Corepack)
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install deps and generate Prisma client
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
# pnpm also needed here
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Use the canonical next build (not the package.json script which uses --turbopack)
# Disable symlinks on Windows to avoid EPERM errors
ENV NEXT_FORCE_NODE_MODULE_RESOLUTION=1
RUN pnpm prisma generate && pnpm exec next build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Ensure pnpm is available in the runtime
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Create non-root user and group
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy built app and dependencies from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user for runtime
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Start the Next.js production server using the shipped next binary
CMD ["pnpm", "exec", "next", "start"]
