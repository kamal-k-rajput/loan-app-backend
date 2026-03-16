import express from "express";
import {
  listAuditLogsController,
  getAuditLogController,
  getAuditLogsByUserController,
  getAuditLogsByEntityController
} from "./auditLog.controllers.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, listAuditLogsController);
router.get("/:id", requireAuth, getAuditLogController);
router.get("/user/:userId", requireAuth, getAuditLogsByUserController);
router.get("/entity/:entityId", requireAuth, getAuditLogsByEntityController);

export const auditLogRouter = router;
