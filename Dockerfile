
##### BUILDER
FROM node:20-alpine AS builder


RUN apk add --update --no-cache python3 make g++
RUN ln -sf python3 /usr/bin/python


WORKDIR /app

COPY package.json pnpm-lock.yaml\* ./

RUN yarn global add pnpm
RUN pnpm i;


COPY . .
ENV DATABASE_FILE ./dev.db

RUN pnpm build


##### RUNNER

FROM --platform=linux/amd64 node:20-alpine AS runner
WORKDIR /app

RUN apk add --update --no-cache python3 make g++
RUN ln -sf python3 /usr/bin/python


ENV DATABASE_FILE ./dev.db
ENV NODE_ENV production


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

COPY package.json pnpm-lock.yaml\* ./
COPY dockerEntrypoint.sh ./dockerEntrypoint.sh
COPY src/lib/server/db/postgres/migrations ./src/lib/server/db/postgres/migrations

EXPOSE 3000
ENV PORT 3000

RUN chmod +x /app/dockerEntrypoint.sh

ENTRYPOINT ["/app/dockerEntrypoint.sh"]
CMD []