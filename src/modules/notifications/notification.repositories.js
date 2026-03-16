import { ObjectId } from "mongodb";

function notificationsCollection(db) {
  return db.collection("notifications");
}

export async function createNotification(db, session, doc) {
  const result = await notificationsCollection(db).insertOne(
    {
      ...doc,
      status: "SENT",
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: "SENT" };
}

export async function listNotifications(db, session, filter = {}) {
  return notificationsCollection(db)
    .find(filter, { session })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getNotificationById(db, session, notificationId) {
  return notificationsCollection(db).findOne({ _id: new ObjectId(notificationId) }, { session });
}

export async function updateNotificationStatus(db, session, notificationId, status) {
  const filter = { _id: new ObjectId(notificationId) };
  const update = {
    $set: {
      status,
      updatedAt: new Date()
    }
  };
  const result = await notificationsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return notificationsCollection(db).findOne(filter, { session });
}
