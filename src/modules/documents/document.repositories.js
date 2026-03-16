import { ObjectId } from "mongodb";

function documentsCollection(db) {
  return db.collection("documents");
}

export async function createDocument(db, session, doc) {
  const result = await documentsCollection(db).insertOne(
    {
      ...doc,
      uploadedAt: new Date(),
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function getDocumentById(db, session, documentId) {
  return documentsCollection(db).findOne({ _id: new ObjectId(documentId) }, { session });
}

export async function deleteDocument(db, session, documentId) {
  const result = await documentsCollection(db).deleteOne({ _id: new ObjectId(documentId) }, { session });
  return result.deletedCount > 0;
}

export async function listDocuments(db, session, filter = {}) {
  return documentsCollection(db)
    .find(filter, { session })
    .sort({ createdAt: -1 })
    .toArray();
}
