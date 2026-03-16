import express from "express";
import {
  sendNotificationController,
  listNotificationsController,
  getNotificationController
} from "./notification.controllers.js";
import { sendNotificationSchema } from "./notification.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", requireAuth, validateBody(sendNotificationSchema), sendNotificationController);
router.get("/", requireAuth, listNotificationsController);
router.get("/:id", requireAuth, getNotificationController);

export const notificationRouter = router;
