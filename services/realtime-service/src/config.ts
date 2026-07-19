import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4010", 10),
  jwtSecret: process.env.JWT_SECRET || "dev-shared-secret-change-me",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaClientId: process.env.KAFKA_CLIENT_ID || "realtime-service",
  kafkaGroupId: process.env.KAFKA_GROUP_ID || "realtime-service-group",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
