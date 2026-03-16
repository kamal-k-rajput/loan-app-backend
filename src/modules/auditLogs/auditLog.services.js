import {
  listAuditLogs,
  getAuditLogById,
  getAuditLogsByUserId,
  getAuditLogsByEntityId
} from "./auditLog.repositories.js";
import { ObjectId } from "mongodb";

export async function listAuditLogsService(db, session, user) {
  let filter = {};

  // Admins see all, others see filtered logs
  if (user.role !== "ADMIN") {
    // Non-admins see only their own logs or logs related to their entities
    if (user.role === "DEALER" && user.dealerId) {
      // Get customers for this dealer
      const customers = await db
        .collection("customers")
        .find({ createdByDealer: new ObjectId(user.dealerId) }, { session })
        .toArray();
      const customerIds = customers.map((c) => c._id);
      filter.$or = [
        { userId: new ObjectId(user.id || user.userId) },
        {
          entityType: "customer",
          entityId: { $in: customerIds.map((id) => new ObjectId(id)) }
        }
      ];
    } else if (user.role === "LENDER" && user.lenderId) {
      // Get contracts for this lender
      const contracts = await db
        .collection("loan_contracts")
        .find({ lenderId: new ObjectId(user.lenderId) }, { session })
        .toArray();
      const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
      filter.$or = [
        { userId: new ObjectId(user.id || user.userId) },
        {
          entityType: "loan",
          entityId: { $in: loanApplicationIds.map((id) => new ObjectId(id)) }
        }
      ];
    } else {
      filter.userId = new ObjectId(user.id || user.userId);
    }
  }

  const logs = await listAuditLogs(db, session, filter);
  return logs.map((log) => ({
    ...log,
    id: log._id.toString(),
    userId: log.userId ? log.userId.toString() : null,
    entityId: log.entityId ? log.entityId.toString() : null
  }));
}

export async function getAuditLogService(db, session, auditLogId) {
  const log = await getAuditLogById(db, session, auditLogId);
  if (!log) return null;
  return {
    ...log,
    id: log._id.toString(),
    userId: log.userId ? log.userId.toString() : null,
    entityId: log.entityId ? log.entityId.toString() : null
  };
}

export async function getAuditLogsByUserService(db, session, userId) {
  const logs = await getAuditLogsByUserId(db, session, userId);
  return logs.map((log) => ({
    ...log,
    id: log._id.toString(),
    userId: log.userId ? log.userId.toString() : null,
    entityId: log.entityId ? log.entityId.toString() : null
  }));
}

export async function getAuditLogsByEntityService(db, session, entityType, entityId) {
  const logs = await getAuditLogsByEntityId(db, session, entityType, entityId);
  return logs.map((log) => ({
    ...log,
    id: log._id.toString(),
    userId: log.userId ? log.userId.toString() : null,
    entityId: log.entityId ? log.entityId.toString() : null
  }));
}
