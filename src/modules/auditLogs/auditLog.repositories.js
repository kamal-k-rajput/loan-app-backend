import { ObjectId } from "mongodb";

function auditLogsCollection(db) {
  return db.collection("audit_logs");
}

export async function createAuditLog(db, session, doc) {
  const result = await auditLogsCollection(db).insertOne(
    {
      ...doc,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listAuditLogs(db, session, filter = {}) {
  return auditLogsCollection(db)
    .find(filter, { session })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();
}

export async function getAuditLogById(db, session, auditLogId) {
  return auditLogsCollection(db).findOne({ _id: new ObjectId(auditLogId) }, { session });
}

export async function getAuditLogsByUserId(db, session, userId) {
  return auditLogsCollection(db)
    .find({ userId: new ObjectId(userId) }, { session })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();
}

export async function getAuditLogsByEntityId(db, session, entityType, entityId) {
  return auditLogsCollection(db)
    .find(
      {
        entityType,
        entityId: new ObjectId(entityId)
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();
}
