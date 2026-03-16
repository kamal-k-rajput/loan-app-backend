import { ObjectId } from "mongodb";

function interestRatesCollection(db) {
  return db.collection("interest_rates");
}

export async function createInterestRate(db, session, doc) {
  const result = await interestRatesCollection(db).insertOne(
    { ...doc, createdAt: new Date() },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listInterestRates(db, session) {
  return interestRatesCollection(db)
    .find({}, { session })
    .toArray();
}

export async function getInterestRateById(db, session, rateId) {
  return interestRatesCollection(db).findOne({ _id: new ObjectId(rateId) }, { session });
}

export async function getInterestRatesByLender(db, session, lenderId) {
  return interestRatesCollection(db)
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .toArray();
}

export async function updateInterestRate(db, session, rateId, updates) {
  const filter = { _id: new ObjectId(rateId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await interestRatesCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return interestRatesCollection(db).findOne(filter, { session });
}

export async function deleteInterestRate(db, session, rateId) {
  const result = await interestRatesCollection(db).deleteOne({ _id: new ObjectId(rateId) }, { session });
  return result.deletedCount > 0;
}
