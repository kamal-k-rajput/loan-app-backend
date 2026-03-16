import {
  listAuditLogsService,
  getAuditLogService,
  getAuditLogsByUserService,
  getAuditLogsByEntityService
} from "./auditLog.services.js";
import { ROLES } from "../../utils/constants.js";

export async function listAuditLogsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const logs = await listAuditLogsService(db, session, req.user);
    return res.success(logs, "AUDIT_LOGS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const log = await getAuditLogService(db, session, req.params.id);
    if (!log) return res.fail(404, "AUDIT_LOG_NOT_FOUND");
    return res.success(log, "AUDIT_LOG_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogsByUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.ADMIN && req.params.userId !== (req.user.id || req.user.userId)) {
      return res.fail(403, "CANNOT_VIEW_OTHER_USER_LOGS");
    }
    const logs = await getAuditLogsByUserService(db, session, req.params.userId);
    return res.success(logs, "AUDIT_LOGS_BY_USER");
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogsByEntityController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const entityType = req.query.entityType || "loan";
    const logs = await getAuditLogsByEntityService(db, session, entityType, req.params.entityId);
    return res.success(logs, "AUDIT_LOGS_BY_ENTITY");
  } catch (err) {
    next(err);
  }
}
