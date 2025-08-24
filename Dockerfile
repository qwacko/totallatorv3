##### BUILDER
FROM node:24-alpine AS builder

# RUN apk add --update --no-cache python3 make g++
# RUN ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy workspace configuration and dependency files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/

# Install pnpm and dependencies
RUN yarn global add pnpm
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build packages first (database, business-logic, etc.), then webapp
RUN pnpm build


##### RUNNER

FROM --platform=linux/amd64 node:24-alpine AS runner
WORKDIR /app

# RUN apk add --update --no-cache python3 make g++
# RUN ln -sf python3 /usr/bin/python

ENV NODE_ENV production

# Copy built packages and webapp
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/*/dist ./packages/*/dist/
COPY --from=builder /app/apps/webapp/build ./build

# Copy configuration files and scripts
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY dockerEntrypoint.sh ./dockerEntrypoint.sh

# Copy database migrations from both packages
COPY --from=builder /app/packages/database/src/migrations ./packages/database/src/migrations
COPY --from=builder /app/packages/logDatabase/src/migrations ./packages/logDatabase/src/migrations

# Copy webapp package.json for runtime dependencies
COPY --from=builder /app/apps/webapp/package.json ./apps/webapp/package.json

EXPOSE 3000
ENV PORT 3000

RUN chmod +x /app/dockerEntrypoint.sh

ENTRYPOINT ["/app/dockerEntrypoint.sh"]
CMD []