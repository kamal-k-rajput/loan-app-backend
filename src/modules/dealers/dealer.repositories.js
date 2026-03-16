import { ObjectId } from "mongodb";

function dealersCollection(db) {
  return db.collection("dealers");
}

export async function createDealer(db, session, doc) {
  const result = await dealersCollection(db).insertOne(
    { ...doc, status: "ACTIVE", createdAt: new Date() },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: "ACTIVE" };
}

export async function listDealers(db, session) {
  return dealersCollection(db)
    .find({}, { session })
    .toArray();
}

export async function getDealerById(db, session, dealerId) {
  return dealersCollection(db).findOne({ _id: new ObjectId(dealerId) }, { session });
}

export async function updateDealer(db, session, dealerId, updates) {
  const filter = { _id: new ObjectId(dealerId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await dealersCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return dealersCollection(db).findOne(filter, { session });
}

export async function deleteDealer(db, session, dealerId) {
  const result = await dealersCollection(db).deleteOne({ _id: new ObjectId(dealerId) }, { session });
  return result.deletedCount > 0;
}

export async function getDealerLoans(db, session, dealerId) {
  return db
    .collection("loan_contracts")
    .find({ dealerId: new ObjectId(dealerId) }, { session })
    .toArray();
}

export async function getDealerCollections(db, session, dealerId) {
  return db
    .collection("collections")
    .find({ dealerId: new ObjectId(dealerId) }, { session })
    .toArray();
}

export async function getDealerEarnings(db, session, dealerId) {
  const pipeline = [
    { $match: { dealerId: new ObjectId(dealerId) } },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: "$commissionAmount" }
      }
    }
  ];
  const [row] = await db.collection("dealer_earnings").aggregate(pipeline, { session }).toArray();
  return row || { totalCommission: 0 };
}

