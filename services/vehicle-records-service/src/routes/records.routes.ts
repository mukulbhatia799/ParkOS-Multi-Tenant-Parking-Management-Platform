import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createEntrySchema } from "../validation/record.validation";
import * as recordsController from "../controllers/records.controller";

const router = Router();

router.use(authenticate);

router.get("/", recordsController.listRecords);
router.get("/:recordId", recordsController.getRecord);
router.post(
  "/entry",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  validateBody(createEntrySchema),
  recordsController.createEntry
);
router.post(
  "/:recordId/exit",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  recordsController.createExit
);

export default router;
