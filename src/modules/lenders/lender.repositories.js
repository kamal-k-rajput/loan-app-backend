import { ObjectId } from "mongodb";

function lendersCollection(db) {
  return db.collection("lenders");
}

export async function createLender(db, session, doc) {
  const result = await lendersCollection(db).insertOne(
    { ...doc, status: "ACTIVE", createdAt: new Date() },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: "ACTIVE" };
}

export async function listLenders(db, session, { search } = {}) {
  const query = {};

  if (search && search.trim()) {
    const searchTerm = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(searchTerm, "i");
    query.$or = [
      { lenderName: searchRegex },
      { contactPerson: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  return lendersCollection(db)
    .find(query, { session })
    .toArray();
}

export async function getLenderById(db, session, lenderId) {
  return lendersCollection(db).findOne({ _id: new ObjectId(lenderId) }, { session });
}

export async function updateLender(db, session, lenderId, updates) {
  const filter = { _id: new ObjectId(lenderId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await lendersCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return lendersCollection(db).findOne(filter, { session });
}

export async function deleteLender(db, session, lenderId) {
  const result = await lendersCollection(db).deleteOne({ _id: new ObjectId(lenderId) }, { session });
  return result.deletedCount > 0;
}

export async function lenderPortfolio(db, session, lenderId) {
  return db
    .collection("loan_contracts")
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .toArray();
}

export async function lenderCollections(db, session, lenderId) {
  return db
    .collection("collections")
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .toArray();
}

