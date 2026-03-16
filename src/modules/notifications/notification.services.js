import {
  createNotification,
  listNotifications,
  getNotificationById
} from "./notification.repositories.js";
import { ObjectId } from "mongodb";

export async function sendNotificationService(db, session, payload) {
  const { userId, customerId, title, message, channel } = payload;

  // If customerId provided, get customer's user ID (if customer has user account)
  // For now, we'll store customerId directly
  let targetUserId = userId ? new ObjectId(userId) : null;

  // In production, you would integrate with SMS/Email/WhatsApp/Push services here
  // For now, we'll just create the notification record

  const notification = await createNotification(db, session, {
    userId: targetUserId,
    customerId: customerId ? new ObjectId(customerId) : null,
    title,
    message,
    channel,
    status: "SENT" // In production, this would be updated based on actual send result
  });

  return {
    ...notification,
    id: notification._id.toString(),
    userId: notification.userId ? notification.userId.toString() : null,
    customerId: notification.customerId ? notification.customerId.toString() : null
  };
}

export async function listNotificationsService(db, session, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    // Get customers for this dealer, then filter notifications
    const customers = await db
      .collection("customers")
      .find({ createdByDealer: new ObjectId(user.dealerId) }, { session })
      .toArray();
    const customerIds = customers.map((c) => c._id);
    filter.$or = [
      { userId: new ObjectId(user.id || user.userId) },
      { customerId: { $in: customerIds.map((id) => new ObjectId(id)) } }
    ];
  } else if (user.role === "LENDER" && user.lenderId) {
    // Lenders see notifications for their loans/customers
    filter.userId = new ObjectId(user.id || user.userId);
  } else if (user.role === "ADMIN") {
    // Admin sees all notifications (no filter)
  } else {
    // For other users, show only their notifications
    filter.userId = new ObjectId(user.id || user.userId);
  }

  const notifications = await listNotifications(db, session, filter);
  return notifications.map((n) => ({
    ...n,
    id: n._id.toString(),
    userId: n.userId ? n.userId.toString() : null,
    customerId: n.customerId ? n.customerId.toString() : null
  }));
}

export async function getNotificationService(db, session, notificationId) {
  const notification = await getNotificationById(db, session, notificationId);
  if (!notification) return null;
  return {
    ...notification,
    id: notification._id.toString(),
    userId: notification.userId ? notification.userId.toString() : null,
    customerId: notification.customerId ? notification.customerId.toString() : null
  };
}
