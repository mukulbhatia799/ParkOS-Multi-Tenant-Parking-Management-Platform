FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/parking-core-service ./services/parking-core-service

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/parking-core-service

WORKDIR /app/services/parking-core-service
EXPOSE 4002
CMD ["node", "dist/index.js"]
