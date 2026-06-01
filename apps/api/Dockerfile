FROM oven/bun:1.3 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock bunfig.toml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/auth/package.json packages/auth/
COPY packages/api/package.json packages/api/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/ui/package.json packages/ui/
COPY packages/validators/package.json packages/validators/
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN echo 'no build step — runner executes apps/api/src/start.ts directly'

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/bunfig.toml ./bunfig.toml
COPY --from=build /app/tsconfig.base.json ./tsconfig.base.json
ENV PORT=3002
EXPOSE 3002
WORKDIR /app
CMD ["bun", "run", "--filter", "@rpg-life/server", "start"]
