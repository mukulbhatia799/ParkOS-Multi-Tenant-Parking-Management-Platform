import { Router } from "express";
import { Role } from "@parking/shared";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { createCameraSchema, updateCameraSchema } from "../validation/camera.validation";
import { startSimulationSchema } from "../validation/simulate.validation";
import { scanSchema } from "../validation/scan.validation";
import * as camerasController from "../controllers/cameras.controller";

const router = Router();

router.use(authenticate);

router.get("/", camerasController.listCameras);
router.post(
  "/",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN),
  validateBody(createCameraSchema),
  camerasController.createCamera
);
router.patch(
  "/:cameraId",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN),
  validateBody(updateCameraSchema),
  camerasController.updateCamera
);
router.delete("/:cameraId", authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN), camerasController.deleteCamera);

router.post(
  "/:cameraId/simulate/start",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  validateBody(startSimulationSchema),
  camerasController.startSimulation
);
router.post(
  "/:cameraId/simulate/stop",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  camerasController.stopSimulation
);

router.post(
  "/:cameraId/scan",
  authorize(Role.CLIENT_ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  validateBody(scanSchema),
  camerasController.scanCamera
);

export default router;
