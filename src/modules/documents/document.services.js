import {
  createDocument,
  getDocumentById,
  deleteDocument,
  listDocuments
} from "./document.repositories.js";
import { ObjectId } from "mongodb";

export async function uploadDocumentService(db, session, payload) {
  const { customerId, loanId, documentType, fileUrl, fileName, fileSize } = payload;

  const doc = {
    documentType,
    fileUrl,
    fileName: fileName || null,
    fileSize: fileSize || null,
    status: "UPLOADED"
  };

  if (customerId) {
    doc.customerId = new ObjectId(customerId);
  }

  if (loanId) {
    doc.loanId = new ObjectId(loanId);
  }

  const document = await createDocument(db, session, doc);
  return {
    ...document,
    id: document._id.toString(),
    customerId: document.customerId ? document.customerId.toString() : null,
    loanId: document.loanId ? document.loanId.toString() : null
  };
}

export async function getDocumentService(db, session, documentId) {
  const document = await getDocumentById(db, session, documentId);
  if (!document) return null;
  return {
    ...document,
    id: document._id.toString(),
    customerId: document.customerId ? document.customerId.toString() : null,
    loanId: document.loanId ? document.loanId.toString() : null
  };
}

export async function deleteDocumentService(db, session, documentId, user) {
  const document = await getDocumentById(db, session, documentId);
  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  // Check permissions
  if (user.role === "DEALER" && document.customerId) {
    // Verify customer belongs to dealer
    const customer = await db
      .collection("customers")
      .findOne(
        {
          _id: document.customerId,
          createdByDealer: new ObjectId(user.dealerId)
        },
        { session }
      );
    if (!customer) {
      throw new Error("DOCUMENT_NOT_ACCESSIBLE");
    }
  }

  return deleteDocument(db, session, documentId);
}

export async function listDocumentsService(db, session, user, filter = {}) {
  let queryFilter = { ...filter };

  if (user.role === "DEALER" && user.dealerId) {
    // Get customers for this dealer
    const customers = await db
      .collection("customers")
      .find({ createdByDealer: new ObjectId(user.dealerId) }, { session })
      .toArray();
    const customerIds = customers.map((c) => c._id);
    queryFilter.customerId = { $in: customerIds.map((id) => new ObjectId(id)) };
  } else if (user.role === "LENDER" && user.lenderId) {
    // Get loans for this lender
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    queryFilter.loanId = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
  }

  const documents = await listDocuments(db, session, queryFilter);
  return documents.map((d) => ({
    ...d,
    id: d._id.toString(),
    customerId: d.customerId ? d.customerId.toString() : null,
    loanId: d.loanId ? d.loanId.toString() : null
  }));
}
