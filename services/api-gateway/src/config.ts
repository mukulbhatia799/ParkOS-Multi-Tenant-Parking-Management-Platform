import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8080", 10),
  jwtSecret: process.env.JWT_SECRET || "dev-shared-secret-change-me",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  parkingCoreServiceUrl: process.env.PARKING_CORE_SERVICE_URL || "http://localhost:4002",
  vehicleRecordsServiceUrl: process.env.VEHICLE_RECORDS_SERVICE_URL || "http://localhost:4003",
  cameraServiceUrl: process.env.CAMERA_SERVICE_URL || "http://localhost:4004",
  pricingBillingServiceUrl: process.env.PRICING_BILLING_SERVICE_URL || "http://localhost:4005",
  realtimeServiceUrl: process.env.REALTIME_SERVICE_URL || "http://localhost:4010",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
