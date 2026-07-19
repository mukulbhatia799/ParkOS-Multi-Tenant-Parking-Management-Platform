import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createVehicleSchema } from "../validation/vehicle.validation";
import * as vehiclesController from "../controllers/vehicles.controller";

const router = Router();

router.use(authenticate);

router.get("/", vehiclesController.listVehicles);
router.post(
  "/",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  validateBody(createVehicleSchema),
  vehiclesController.createVehicle
);
router.get("/:plate/locate", vehiclesController.locateVehicle);

export default router;
