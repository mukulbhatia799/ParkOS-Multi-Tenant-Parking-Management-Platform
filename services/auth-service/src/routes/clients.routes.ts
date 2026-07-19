import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { requireSelfClientOrSuperAdmin } from "../middleware/tenantScope";
import { validateBody } from "../middleware/validate";
import { createClientSchema, updateClientSchema } from "../validation/client.validation";
import * as clientsController from "../controllers/clients.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(Role.SUPER_ADMIN), clientsController.listClients);
router.post("/", authorize(Role.SUPER_ADMIN), validateBody(createClientSchema), clientsController.createClient);
router.get("/:clientId", requireSelfClientOrSuperAdmin, clientsController.getClient);
router.patch(
  "/:clientId",
  authorize(Role.SUPER_ADMIN),
  validateBody(updateClientSchema),
  clientsController.updateClient
);
router.delete("/:clientId", authorize(Role.SUPER_ADMIN), clientsController.deleteClient);

export default router;
