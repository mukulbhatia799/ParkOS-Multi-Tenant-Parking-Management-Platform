FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/realtime-service ./services/realtime-service

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/realtime-service

WORKDIR /app/services/realtime-service
EXPOSE 4010
CMD ["node", "dist/index.js"]
