import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as detectionsController from "../controllers/detections.controller";

const router = Router();

router.use(authenticate);

router.get("/", detectionsController.listDetections);

export default router;
