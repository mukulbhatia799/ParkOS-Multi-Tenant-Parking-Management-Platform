import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createZoneSchema, updateZoneSchema } from "../validation/zone.validation";
import * as zonesController from "../controllers/zones.controller";

// Mounted twice:
//  - /lots/:lotId/zones  (list, create)
//  - /zones/:zoneId      (update, delete)
const lotScopedRouter = Router({ mergeParams: true });
lotScopedRouter.use(authenticate);
lotScopedRouter.get("/", zonesController.listZones);
lotScopedRouter.post("/", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), validateBody(createZoneSchema), zonesController.createZone);

const zoneRouter = Router();
zoneRouter.use(authenticate);
zoneRouter.patch("/:zoneId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), validateBody(updateZoneSchema), zonesController.updateZone);
zoneRouter.delete("/:zoneId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), zonesController.deleteZone);

export { lotScopedRouter as lotZonesRouter, zoneRouter };
