import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4004", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/camera-db",
  jwtSecret: process.env.JWT_SECRET || "dev-shared-secret-change-me",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaClientId: process.env.KAFKA_CLIENT_ID || "camera-service",
  kafkaGroupId: process.env.KAFKA_GROUP_ID || "camera-service-group",
  internalApiKey: process.env.INTERNAL_API_KEY || "dev-internal-key-change-me",
  cvServiceUrl: process.env.CV_SERVICE_URL || "http://localhost:8000",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
