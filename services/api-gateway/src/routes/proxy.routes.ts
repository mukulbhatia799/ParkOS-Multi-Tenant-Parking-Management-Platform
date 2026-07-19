import { Router, Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";
import { authenticate } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Strips the gateway's "/api" prefix using the original, unmodified URL -
// robust regardless of how many router.use() path segments were consumed.
const stripApiPrefix = (_path: string, req: Request) => req.originalUrl.replace(/^\/api/, "");

// Public auth routes (login) - no JWT required
router.use(
  "/auth",
  createProxyMiddleware({
    target: config.authServiceUrl,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
  })
);

// Everything below requires a valid JWT + rate limiting
router.use(authenticate, apiRateLimiter);

router.use(
  "/clients",
  createProxyMiddleware({
    target: config.authServiceUrl,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
  })
);

router.use(
  ["/lots", "/zones", "/slots", "/navigation"],
  createProxyMiddleware({
    target: config.parkingCoreServiceUrl,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
  })
);

router.use(
  ["/vehicles", "/parking-records"],
  createProxyMiddleware({
    target: config.vehicleRecordsServiceUrl,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
  })
);

router.use(
  ["/cameras", "/detections"],
  createProxyMiddleware({
    target: config.cameraServiceUrl,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
  })
);

router.use(
  ["/pricing-rules", "/billing"],
  createProxyMiddleware({
    target: config.pricingBillingServiceUrl,
    changeOrigin: true,
    pathRewrite: stripApiPrefix,
  })
);

export default router;
