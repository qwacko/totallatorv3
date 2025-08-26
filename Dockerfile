##### BUILDER
FROM node:24-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies and build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm run build

# Deploy just the webapp with production dependencies
RUN pnpm deploy --filter=@totallator/webapp --prod out


##### RUNNER

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy the deployed output from builder stage
COPY --from=builder /app/out/ .
COPY dockerEntrypoint.sh ./dockerEntrypoint.sh

RUN chmod +x /app/dockerEntrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/dockerEntrypoint.sh"]
CMD []