import { Router, Response } from "express";
import axios from "axios";
import { config } from "../config";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

/**
 * BFF aggregation endpoint for the dashboard. In Chunk 1 this only fans out
 * to parking-core for slot occupancy; later chunks will also fan out to
 * analytics-service and alerts-fraud-service.
 */
router.get("/summary", async (req: AuthenticatedRequest, res: Response) => {
  const { lotId } = req.query;
  const authHeader = req.headers.authorization;

  if (!lotId) {
    return res.status(400).json({ error: "lotId query parameter is required" });
  }

  try {
    const { data: slots } = await axios.get(`${config.parkingCoreServiceUrl}/lots/${lotId}/slots`, {
      headers: { Authorization: authHeader },
    });

    const totalSlots = slots.length;
    const occupied = slots.filter((s: { status: string }) => s.status === "occupied").length;
    const available = slots.filter((s: { status: string }) => s.status === "available").length;

    res.json({
      lotId,
      totalSlots,
      occupied,
      available,
      // placeholders for future chunks (vehicle-records, analytics, alerts)
      currentVehicles: occupied,
      revenueToday: 0,
      entriesToday: 0,
      exitsToday: 0,
    });
  } catch (err) {
    console.error("[api-gateway] dashboard summary error", err);
    res.status(502).json({ error: "Failed to aggregate dashboard summary" });
  }
});

export default router;
