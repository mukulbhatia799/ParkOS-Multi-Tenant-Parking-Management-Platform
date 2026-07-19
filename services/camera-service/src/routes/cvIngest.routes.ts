import { Router } from "express";
import { internalAuth } from "../middleware/internalAuth.middleware";
import { validateBody } from "../middleware/validate";
import { ingestDetectionSchema } from "../validation/simulate.validation";
import * as cvIngestController from "../controllers/cvIngest.controller";

const router = Router();

router.use(internalAuth);

router.post("/detections", validateBody(ingestDetectionSchema), cvIngestController.ingestDetection);

export default router;
