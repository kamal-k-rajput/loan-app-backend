import { createAuditLog } from "../modules/auditLogs/auditLog.repositories.js";
import { ObjectId } from "mongodb";

/**
 * Utility function to create audit logs
 * Can be called from any service to log actions
 */
export async function logAuditEvent(db, session, {
  userId,
  role,
  action,
  entityType,
  entityId,
  previousData = null,
  newData = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    await createAuditLog(db, session, {
      userId: userId ? new ObjectId(userId) : null,
      role: role || null,
      action,
      entityType: entityType || null,
      entityId: entityId ? new ObjectId(entityId) : null,
      previousData,
      newData,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    });
  } catch (error) {
    // Don't throw error if audit logging fails - it shouldn't break the main flow
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to extract IP and User Agent from request
 */
export function getRequestMetadata(req) {
  return {
    ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null
  };
}
