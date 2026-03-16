import express from "express";
import {
  createConfigController,
  listConfigsController,
  getConfigController,
  updateConfigController,
  deleteConfigController
} from "./config.controllers.js";
import { createConfigSchema, updateConfigSchema } from "./config.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.post("/", requireRole(ROLES.ADMIN), validateBody(createConfigSchema), createConfigController);
router.get("/", requireAuth, listConfigsController);
router.get("/:configId", requireAuth, getConfigController);
router.put("/:configId", requireRole(ROLES.ADMIN), validateBody(updateConfigSchema), updateConfigController);
router.delete("/:configId", requireRole(ROLES.ADMIN), deleteConfigController);

export const configRouter = router;
