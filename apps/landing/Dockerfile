FROM node:20-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/landing/package.json ./apps/landing/
RUN pnpm install --frozen-lockfile
COPY apps/landing ./apps/landing
RUN pnpm -C apps/landing build

FROM node:20-alpine
WORKDIR /app
RUN npm i -g pnpm
COPY apps/landing/package.json ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/landing/dist ./dist
EXPOSE 3000
CMD ["pnpm", "start"]
