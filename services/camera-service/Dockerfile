FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/camera-service ./services/camera-service

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/camera-service

WORKDIR /app/services/camera-service
EXPOSE 4004
CMD ["node", "dist/index.js"]
