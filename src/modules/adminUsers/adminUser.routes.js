import express from "express";
import {
  createUserController,
  listUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
  activateUserController,
  deactivateUserController,
  listRolesController
} from "./adminUser.controllers.js";
import { createUserSchema, updateUserSchema } from "./adminUser.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

// All admin user management endpoints are only for ADMIN role
router.post("/", requireRole(ROLES.ADMIN), validateBody(createUserSchema), createUserController);
router.get("/", requireRole(ROLES.ADMIN), listUsersController);
router.get("/:userId", requireRole(ROLES.ADMIN), getUserController);
router.put(
  "/:userId",
  requireRole(ROLES.ADMIN),
  validateBody(updateUserSchema),
  updateUserController
);
router.delete("/:userId", requireRole(ROLES.ADMIN), deleteUserController);

router.put("/:userId/activate", requireRole(ROLES.ADMIN), activateUserController);
router.put("/:userId/deactivate", requireRole(ROLES.ADMIN), deactivateUserController);

router.get("/roles/list", requireRole(ROLES.ADMIN), listRolesController);

export const adminUserRouter = router;

