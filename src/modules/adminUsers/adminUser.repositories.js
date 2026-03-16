import { ObjectId } from "mongodb";
import { ROLES } from "../../utils/constants.js";

export function usersCollection(db) {
  return db.collection("users");
}

export async function createUser(db, session, doc) {
  const result = await usersCollection(db).insertOne(
    {
      ...doc,
      status: "ACTIVE",
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: "ACTIVE" };
}

export async function listUsers(db, session) {
  return usersCollection(db)
    .find({}, { session })
    .toArray();
}

export async function getUserById(db, session, userId) {
  return usersCollection(db).findOne({ _id: new ObjectId(userId) }, { session });
}

export async function updateUser(db, session, userId, updates) {
  const filter = { _id: new ObjectId(userId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await usersCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return usersCollection(db).findOne(filter, { session });
}

export async function deleteUser(db, session, userId) {
  const result = await usersCollection(db).deleteOne({ _id: new ObjectId(userId) }, { session });
  return result.deletedCount > 0;
}

export async function setUserStatus(db, session, userId, status) {
  const filter = { _id: new ObjectId(userId) };
  const update = { $set: { status, updatedAt: new Date() } };

  const result = await usersCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return usersCollection(db).findOne(filter, { session });
}

export function listRoles() {
  return Object.values(ROLES);
}

