FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/auth-service ./services/auth-service

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/auth-service

WORKDIR /app/services/auth-service
EXPOSE 4001
CMD ["node", "dist/index.js"]
