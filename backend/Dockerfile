FROM node:20-alpine

RUN corepack enable

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY backend/package.json ./backend/

RUN pnpm install

COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 3001

CMD ["pnpm", "dev"]