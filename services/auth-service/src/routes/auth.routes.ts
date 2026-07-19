import { Router } from "express";
import { login, signup, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate";
import { loginSchema, signupSchema } from "../validation/auth.validation";

const router = Router();

router.post("/login", validateBody(loginSchema), login);
router.post("/signup", validateBody(signupSchema), signup);
router.get("/me", authenticate, me);

export default router;
