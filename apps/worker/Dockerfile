FROM node:24-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @totallator/worker build
RUN pnpm deploy --filter=@totallator/worker --prod --legacy out

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/out/ .
COPY --from=builder /app/packages/database/src/migrations ./packages/database/src/migrations
COPY --from=builder /app/packages/logDatabase/src/migrations ./packages/logDatabase/src/migrations

CMD ["node", "dist/main.js"]
