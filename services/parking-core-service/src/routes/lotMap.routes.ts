import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import * as lotMapController from "../controllers/lotMap.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", lotMapController.listLevels);
router.get("/:level", lotMapController.getLevel);
router.put(
  "/:level",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN),
  lotMapController.saveLevel
);
router.post(
  "/:level/copy",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN),
  lotMapController.copyLevel
);
router.delete(
  "/:level",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN),
  lotMapController.deleteLevel
);

export default router;
