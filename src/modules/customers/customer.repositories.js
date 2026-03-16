import { ObjectId } from "mongodb";

function customersCollection(db) {
  return db.collection("customers");
}

export async function createCustomer(db, session, doc) {
  const result = await customersCollection(db).insertOne(
    { ...doc, createdAt: new Date() },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listCustomers(db, session) {
  return customersCollection(db)
    .find({}, { session })
    .toArray();
}

export async function getCustomerById(db, session, customerId) {
  return customersCollection(db).findOne({ _id: new ObjectId(customerId) }, { session });
}

export async function updateCustomer(db, session, customerId, updates) {
  const result = await customersCollection(db).findOneAndUpdate(
    { _id: new ObjectId(customerId) },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after", session }
  );
  return result.value;
}

export async function deleteCustomer(db, session, customerId) {
  const result = await customersCollection(db).deleteOne(
    { _id: new ObjectId(customerId) },
    { session }
  );
  return result.deletedCount > 0;
}

export async function getCustomerLoans(db, session, customerId) {
  return db
    .collection("loan_contracts")
    .find({ customerId: new ObjectId(customerId) }, { session })
    .toArray();
}

export async function getCustomerEmis(db, session, customerId) {
  return db
    .collection("emi_schedule")
    .find({ customerId: new ObjectId(customerId) }, { session })
    .toArray();
}

export async function getCustomerPayments(db, session, customerId) {
  return db
    .collection("payments")
    .find({ customerId: new ObjectId(customerId) }, { session })
    .toArray();
}

