import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4002", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/parking-core-db",
  jwtSecret: process.env.JWT_SECRET || "dev-shared-secret-change-me",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaClientId: process.env.KAFKA_CLIENT_ID || "parking-core-service",
  kafkaGroupId: process.env.KAFKA_GROUP_ID || "parking-core-service-group",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
