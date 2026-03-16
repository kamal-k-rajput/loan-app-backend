import { ObjectId } from "mongodb";
import { COLLECTION_STATUS } from "../../utils/constants.js";

function collectionsCollection(db) {
  return db.collection("collections");
}

export async function createCollection(db, session, doc) {
  const result = await collectionsCollection(db).insertOne(
    {
      ...doc,
      status: COLLECTION_STATUS.COLLECTED,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: COLLECTION_STATUS.COLLECTED };
}

export async function listCollections(db, session, filter = {}) {
  return collectionsCollection(db)
    .find(filter, { session })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getCollectionById(db, session, collectionId) {
  return collectionsCollection(db).findOne({ _id: new ObjectId(collectionId) }, { session });
}

export async function updateCollectionStatus(db, session, collectionId, status, data = {}) {
  const filter = { _id: new ObjectId(collectionId) };
  const update = {
    $set: {
      status,
      ...data,
      updatedAt: new Date()
    }
  };
  const result = await collectionsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return collectionsCollection(db).findOne(filter, { session });
}

export async function getPendingCollections(db, session, lenderId) {
  return collectionsCollection(db)
    .find(
      {
        status: COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION,
        lenderId: lenderId ? new ObjectId(lenderId) : { $exists: true }
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .toArray();
}
