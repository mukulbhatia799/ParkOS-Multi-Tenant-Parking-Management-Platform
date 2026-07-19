FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY shared ./shared
COPY services/pricing-billing-service ./services/pricing-billing-service

RUN npm install --workspaces --include-workspace-root=false --legacy-peer-deps || npm install

RUN npm run build -w @parking/shared
RUN npm run build -w @parking/pricing-billing-service

WORKDIR /app/services/pricing-billing-service
EXPOSE 4005
CMD ["node", "dist/index.js"]
