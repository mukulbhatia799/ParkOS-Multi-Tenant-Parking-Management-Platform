import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { requireSelfClientOrSuperAdmin } from "../middleware/tenantScope";
import { validateBody } from "../middleware/validate";
import { createUserSchema, updateUserSchema } from "../validation/user.validation";
import * as usersController from "../controllers/users.controller";

const router = Router({ mergeParams: true });

// mounted at /clients/:clientId/users (":clientId" can be "platform" for super_admin users)
router.use(authenticate);
router.use(requireSelfClientOrSuperAdmin, authorize(Role.SUPER_ADMIN, Role.CLIENT_ADMIN));

router.get("/", usersController.listUsers);
router.post("/", validateBody(createUserSchema), usersController.createUser);
router.patch("/:userId", validateBody(updateUserSchema), usersController.updateUser);
router.delete("/:userId", usersController.deleteUser);

export default router;
