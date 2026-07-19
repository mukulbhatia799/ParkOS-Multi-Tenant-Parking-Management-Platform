FROM node:20-alpine

WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY frontend/package.json frontend/package.json

RUN npm install --workspace=@parking/frontend

COPY frontend ./frontend

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev"]
