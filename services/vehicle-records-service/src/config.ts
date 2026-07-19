import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4003", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/vehicle-records-db",
  jwtSecret: process.env.JWT_SECRET || "dev-shared-secret-change-me",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaClientId: process.env.KAFKA_CLIENT_ID || "vehicle-records-service",
  kafkaGroupId: process.env.KAFKA_GROUP_ID || "vehicle-records-service-group",
  parkingCoreServiceUrl: process.env.PARKING_CORE_SERVICE_URL || "http://localhost:4002",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
