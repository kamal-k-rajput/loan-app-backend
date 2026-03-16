import { ObjectId } from "mongodb";

function loanProductsCollection(db) {
  return db.collection("loan_products");
}

export async function createLoanProduct(db, session, doc) {
  const result = await loanProductsCollection(db).insertOne(
    { ...doc, createdAt: new Date() },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listLoanProducts(db, session) {
  return loanProductsCollection(db)
    .find({}, { session })
    .toArray();
}

export async function getLoanProductById(db, session, productId) {
  return loanProductsCollection(db).findOne({ _id: new ObjectId(productId) }, { session });
}

export async function updateLoanProduct(db, session, productId, updates) {
  const filter = { _id: new ObjectId(productId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await loanProductsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return loanProductsCollection(db).findOne(filter, { session });
}

export async function deleteLoanProduct(db, session, productId) {
  const result = await loanProductsCollection(db).deleteOne({ _id: new ObjectId(productId) }, { session });
  return result.deletedCount > 0;
}
