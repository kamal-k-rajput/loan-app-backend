import { ObjectId } from "mongodb";

function paymentsCollection(db) {
  return db.collection("payments");
}

function emiScheduleCollection(db) {
  return db.collection("emi_schedule");
}

export async function createPayment(db, session, doc) {
  const result = await paymentsCollection(db).insertOne(
    {
      ...doc,
      status: "INITIATED",
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: "INITIATED" };
}

export async function updatePaymentStatus(db, session, paymentId, status, data = {}) {
  const filter = { _id: new ObjectId(paymentId) };
  const update = {
    $set: {
      status,
      ...data,
      updatedAt: new Date()
    }
  };
  const result = await paymentsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return paymentsCollection(db).findOne(filter, { session });
}

export async function listPayments(db, session, filter = {}) {
  return paymentsCollection(db)
    .find(filter, { session })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getPaymentById(db, session, paymentId) {
  return paymentsCollection(db).findOne({ _id: new ObjectId(paymentId) }, { session });
}

export async function getPaymentsByLoanId(db, session, loanId) {
  return paymentsCollection(db)
    .find({ loanId: new ObjectId(loanId) }, { session })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getEmiById(db, session, emiId) {
  return emiScheduleCollection(db).findOne({ _id: new ObjectId(emiId) }, { session });
}

export async function updateEmiStatus(db, session, emiId, updates) {
  const filter = { _id: new ObjectId(emiId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await emiScheduleCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return emiScheduleCollection(db).findOne(filter, { session });
}
