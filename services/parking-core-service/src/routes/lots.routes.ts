import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createLotSchema, updateLotSchema } from "../validation/lot.validation";
import * as lotsController from "../controllers/lots.controller";

const router = Router();

router.use(authenticate);

router.get("/", lotsController.listLots);
router.post("/", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), validateBody(createLotSchema), lotsController.createLot);
router.get("/:lotId", lotsController.getLot);
router.patch(
  "/:lotId",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN),
  validateBody(updateLotSchema),
  lotsController.updateLot
);
router.delete("/:lotId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), lotsController.deleteLot);

export default router;
