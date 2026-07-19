import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createSlotSchema, updateSlotSchema } from "../validation/slot.validation";
import * as slotsController from "../controllers/slots.controller";

// Mounted twice:
//  - /lots/:lotId/slots  (list, create/bulk-create)
//  - /slots/:slotId      (update, delete)
const lotScopedRouter = Router({ mergeParams: true });
lotScopedRouter.use(authenticate);
lotScopedRouter.get("/", slotsController.listSlots);
lotScopedRouter.post("/", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), slotsController.createSlot);

const slotRouter = Router();
slotRouter.use(authenticate);
slotRouter.post("/assign", slotsController.assignSlot);
slotRouter.get("/:slotId", slotsController.getSlot);
slotRouter.patch("/:slotId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR), validateBody(updateSlotSchema), slotsController.updateSlot);
slotRouter.delete("/:slotId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), slotsController.deleteSlot);

export { lotScopedRouter as lotSlotsRouter, slotRouter };
