import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as navigationController from "../controllers/navigation.controller";

const router = Router();

router.use(authenticate);
router.get("/route", navigationController.getRoute);

export default router;
