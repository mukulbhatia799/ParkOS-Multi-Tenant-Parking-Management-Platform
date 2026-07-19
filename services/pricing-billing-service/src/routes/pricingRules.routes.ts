import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createPricingRuleSchema, updatePricingRuleSchema } from "../validation/pricingRule.validation";
import * as controller from "../controllers/pricingRules.controller";

const router = Router();
router.use(authenticate);

router.get("/", controller.listRules);
router.post("/", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), validateBody(createPricingRuleSchema), controller.createRule);
router.patch("/:ruleId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), validateBody(updatePricingRuleSchema), controller.updateRule);
router.delete("/:ruleId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), controller.deleteRule);

export default router;
