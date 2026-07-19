import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4001", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/auth-db",
  jwtSecret: process.env.JWT_SECRET || "dev-shared-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaClientId: process.env.KAFKA_CLIENT_ID || "auth-service",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
