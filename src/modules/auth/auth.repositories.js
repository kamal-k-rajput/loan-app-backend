import { ObjectId } from "mongodb";

export function getUsersCollection(db) {
  return db.collection("users");
}

export async function findUserByEmail(db, session, email) {
  return getUsersCollection(db).findOne({ email }, { session });
}

export async function findUserById(db, session, userId) {
  return getUsersCollection(db).findOne({ _id: new ObjectId(userId) }, { session });
}

export async function updateUserPassword(db, session, userId, passwordHash) {
  const result = await getUsersCollection(db).updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash } },
    { session }
  );
  return result.modifiedCount > 0;
}

export async function updateUserProfile(db, session, userId, updates) {
  const filter = { _id: new ObjectId(userId) };
  await getUsersCollection(db).updateOne(filter, { $set: { ...updates } }, { session });
  return getUsersCollection(db).findOne(filter, { session });
}

