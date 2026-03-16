import {
  sendNotificationService,
  listNotificationsService,
  getNotificationService
} from "./notification.services.js";
import { ROLES } from "../../utils/constants.js";

export async function sendNotificationController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_SEND_NOTIFICATIONS");
    }
    const result = await sendNotificationService(db, session, req.body);
    return res.success(result, "NOTIFICATION_SENT");
  } catch (err) {
    next(err);
  }
}

export async function listNotificationsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const notifications = await listNotificationsService(db, session, req.user);
    return res.success(notifications, "NOTIFICATIONS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getNotificationController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const notification = await getNotificationService(db, session, req.params.id);
    if (!notification) return res.fail(404, "NOTIFICATION_NOT_FOUND");
    return res.success(notification, "NOTIFICATION_FETCHED");
  } catch (err) {
    next(err);
  }
}
