import { ObjectId } from "mongodb";
import { CUSTOMER_KYC_STATUS } from "../../utils/constants.js";

function documentsCollection(db) {
  return db.collection("documents");
}

function customersCollection(db) {
  return db.collection("customers");
}

export async function createDocument(db, session, doc) {
  const result = await documentsCollection(db).insertOne(
    {
      ...doc,
      status: "UPLOADED",
      uploadedAt: new Date(),
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: "UPLOADED" };
}

export async function getDocumentsByCustomer(db, session, customerId) {
  return documentsCollection(db)
    .find({ customerId: new ObjectId(customerId) }, { session })
    .toArray();
}

export async function updateDocumentStatus(db, session, customerId, documentType, status, data = {}) {
  const filter = {
    customerId: new ObjectId(customerId)
  };
  if (documentType) {
    filter.documentType = documentType;
  }
  const update = {
    $set: {
      status,
      ...data,
      updatedAt: new Date()
    }
  };
  const result = await documentsCollection(db).updateMany(filter, update, { session });
  return result.modifiedCount > 0;
}

export async function updateCustomerKycStatus(db, session, customerId, kycStatus) {
  const result = await customersCollection(db).updateOne(
    { _id: new ObjectId(customerId) },
    { $set: { kycStatus, updatedAt: new Date() } },
    { session }
  );
  return result.modifiedCount > 0;
}

export async function getCustomerById(db, session, customerId) {
  return customersCollection(db).findOne({ _id: new ObjectId(customerId) }, { session });
}
