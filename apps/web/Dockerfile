FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock bunfig.toml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/auth/package.json packages/auth/
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/ui/package.json packages/ui/
COPY packages/validators/package.json packages/validators/
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
# API_URL is baked into the standalone rewrites at build time. Default targets
# the compose `api` service; override via compose build args for other hosts.
ARG API_URL=http://api:3002
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/web
RUN bun run build
WORKDIR /app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["bun", "apps/web/server.js"]
