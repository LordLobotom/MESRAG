# 1. Build fáze
FROM node:18-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install -g pnpm \
  && pnpm install \
  && pnpm build

# 2. Run-time fáze
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
