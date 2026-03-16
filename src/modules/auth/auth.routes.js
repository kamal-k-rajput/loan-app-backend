import express from "express";
import {
  loginController,
  logoutController,
  refreshTokenController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  profileController,
  updateProfileController
} from "./auth.controllers.js";
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema
} from "./auth.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Public routes - no auth required
router.post("/login", validateBody(loginSchema), loginController);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);

// Protected routes - require valid token
router.post("/logout", requireAuth, logoutController);
router.post("/refresh-token", requireAuth, refreshTokenController);
router.post("/change-password", requireAuth, validateBody(changePasswordSchema), changePasswordController);
router.get("/profile", requireAuth, profileController);
router.put("/profile/update", requireAuth, validateBody(updateProfileSchema), updateProfileController);

export const authRouter = router;


