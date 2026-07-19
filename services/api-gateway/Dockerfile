FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/api-gateway ./services/api-gateway

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/api-gateway

WORKDIR /app/services/api-gateway
EXPOSE 8080
CMD ["node", "dist/index.js"]
