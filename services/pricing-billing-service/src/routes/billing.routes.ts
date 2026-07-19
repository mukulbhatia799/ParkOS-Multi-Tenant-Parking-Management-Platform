import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/billing.controller";

const router = Router();
router.use(authenticate);

router.get("/", controller.listBilling);
router.get("/by-record/:parkingRecordId", controller.getBillingByRecord);

export default router;
