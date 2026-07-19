FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/vehicle-records-service ./services/vehicle-records-service

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/vehicle-records-service

WORKDIR /app/services/vehicle-records-service
EXPOSE 4003
CMD ["node", "dist/index.js"]
