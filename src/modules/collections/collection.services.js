import {
  createCollection,
  listCollections,
  getCollectionById,
  updateCollectionStatus,
  getPendingCollections,
} from "./collection.repositories.js";
import { COLLECTION_STATUS, EMI_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function recordCollectionService(db, session, payload, dealerId) {
  const { loanId, emiId, amountCollected } = payload;

  // Verify loan belongs to dealer
  const loan = await db.collection("loan_applications").findOne(
    {
      _id: new ObjectId(loanId),
      dealerId: new ObjectId(dealerId),
    },
    { session },
  );

  if (!loan) {
    throw new Error("LOAN_NOT_FOUND_OR_NOT_ACCESSIBLE");
  }

  // Verify EMI belongs to loan
  const emi = await db.collection("emi_schedule").findOne(
    {
      _id: new ObjectId(emiId),
      loanId: new ObjectId(loanId),
    },
    { session },
  );

  if (!emi) {
    throw new Error("EMI_NOT_FOUND_OR_MISMATCH");
  }

  if (emi.status === EMI_STATUS.PAID) {
    throw new Error("EMI_ALREADY_PAID");
  }

  // Check no pending collection exists for this EMI
  const existingCollection = await db.collection("collections").findOne(
    {
      emiId: new ObjectId(emiId),
      status: COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION,
    },
    { session },
  );
  if (existingCollection) {
    throw new Error("COLLECTION_ALREADY_SUBMITTED_FOR_EMI");
  }

  // Get lender from loan contract
  const contract = await db
    .collection("loan_contracts")
    .findOne({ loanApplicationId: new ObjectId(loanId) }, { session });

  if (!contract) {
    throw new Error("LOAN_CONTRACT_NOT_FOUND");
  }

  // Create collection record
  const collection = await createCollection(db, session, {
    loanId: new ObjectId(loanId),
    emiId: new ObjectId(emiId),
    dealerId: new ObjectId(dealerId),
    lenderId: contract.lenderId,
    amountCollected,
    collectionMode: "CASH",
    status: COLLECTION_STATUS.COLLECTED,
  });

  // Update status to pending lender confirmation
  await updateCollectionStatus(
    db,
    session,
    collection._id,
    COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION,
  );

  // Mark EMI as PAID immediately so dealer & customer see it as paid when dealer submits
  // Lender still sees it in pending collections and must approve; on reject, EMI is reverted
  await db.collection("emi_schedule").updateOne(
    { _id: new ObjectId(emiId) },
    {
      $set: {
        status: EMI_STATUS.PAID,
        paidAmount: amountCollected,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { session },
  );

  return {
    ...collection,
    id: collection._id.toString(),
    loanId: collection.loanId.toString(),
    emiId: collection.emiId.toString(),
    dealerId: collection.dealerId.toString(),
    lenderId: collection.lenderId.toString(),
  };
}

export async function listCollectionsService(db, session, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    filter.dealerId = new ObjectId(user.dealerId);
  } else if (user.role === "LENDER" && user.lenderId) {
    filter.lenderId = new ObjectId(user.lenderId);
  }

  const collections = await listCollections(db, session, filter);
  return collections.map((c) => ({
    ...c,
    id: c._id.toString(),
    loanId: c.loanId ? c.loanId.toString() : null,
    emiId: c.emiId ? c.emiId.toString() : null,
    dealerId: c.dealerId ? c.dealerId.toString() : null,
    lenderId: c.lenderId ? c.lenderId.toString() : null,
    lenderApprovedBy: c.lenderApprovedBy ? c.lenderApprovedBy.toString() : null,
  }));
}

export async function getCollectionService(db, session, collectionId) {
  const collection = await getCollectionById(db, session, collectionId);
  if (!collection) return null;
  return {
    ...collection,
    id: collection._id.toString(),
    loanId: collection.loanId ? collection.loanId.toString() : null,
    emiId: collection.emiId ? collection.emiId.toString() : null,
    dealerId: collection.dealerId ? collection.dealerId.toString() : null,
    lenderId: collection.lenderId ? collection.lenderId.toString() : null,
    lenderApprovedBy: collection.lenderApprovedBy
      ? collection.lenderApprovedBy.toString()
      : null,
  };
}

export async function approveCollectionService(
  db,
  session,
  collectionId,
  lenderId,
  remarks,
) {
  const collection = await getCollectionById(db, session, collectionId);
  if (!collection) {
    throw new Error("COLLECTION_NOT_FOUND");
  }

  if (collection.status !== COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION) {
    throw new Error("COLLECTION_NOT_PENDING_APPROVAL");
  }

  // Only the lender who disbursed the loan can approve this collection
  const contract = await db
    .collection("loan_contracts")
    .findOne({ loanApplicationId: collection.loanId }, { session });
  if (!contract || contract.lenderId.toString() !== lenderId) {
    throw new Error("CANNOT_APPROVE_OTHER_LENDER_COLLECTION");
  }

  await updateCollectionStatus(
    db,
    session,
    collectionId,
    COLLECTION_STATUS.APPROVED,
    {
      lenderApprovedBy: new ObjectId(lenderId),
      approvedAt: new Date(),
      remarks,
    },
  );

  // EMI was already marked PAID when dealer submitted; create payment record on lender approval
  await db.collection("payments").insertOne(
    {
      loanId: collection.loanId,
      emiId: collection.emiId,
      amount: collection.amountCollected,
      paymentMode: "CASH",
      status: "SUCCESS",
      transactionId: `CASH_${collection._id}`,
      createdAt: new Date(),
    },
    { session },
  );

  const updated = await getCollectionById(db, session, collectionId);
  return {
    ...updated,
    id: updated._id.toString(),
    loanId: updated.loanId ? updated.loanId.toString() : null,
    emiId: updated.emiId ? updated.emiId.toString() : null,
    dealerId: updated.dealerId ? updated.dealerId.toString() : null,
    lenderId: updated.lenderId ? updated.lenderId.toString() : null,
    lenderApprovedBy: updated.lenderApprovedBy
      ? updated.lenderApprovedBy.toString()
      : null,
  };
}

export async function rejectCollectionService(
  db,
  session,
  collectionId,
  lenderId,
  reason,
) {
  const collection = await getCollectionById(db, session, collectionId);
  if (!collection) {
    throw new Error("COLLECTION_NOT_FOUND");
  }

  if (collection.status !== COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION) {
    throw new Error("COLLECTION_NOT_PENDING_APPROVAL");
  }

  // Only the lender who disbursed the loan can reject this collection
  const contract = await db
    .collection("loan_contracts")
    .findOne({ loanApplicationId: collection.loanId }, { session });
  if (!contract || contract.lenderId.toString() !== lenderId) {
    throw new Error("CANNOT_REJECT_OTHER_LENDER_COLLECTION");
  }

  await updateCollectionStatus(
    db,
    session,
    collectionId,
    COLLECTION_STATUS.REJECTED,
    {
      lenderApprovedBy: new ObjectId(lenderId),
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  );

  // Revert EMI to PENDING since lender rejected the collection
  await db.collection("emi_schedule").updateOne(
    { _id: collection.emiId },
    {
      $set: { status: EMI_STATUS.PENDING, updatedAt: new Date() },
      $unset: { paidAmount: "", paidAt: "" },
    },
    { session },
  );

  const updated = await getCollectionById(db, session, collectionId);
  return {
    ...updated,
    id: updated._id.toString(),
    loanId: updated.loanId ? updated.loanId.toString() : null,
    emiId: updated.emiId ? updated.emiId.toString() : null,
    dealerId: updated.dealerId ? updated.dealerId.toString() : null,
    lenderId: updated.lenderId ? updated.lenderId.toString() : null,
    lenderApprovedBy: updated.lenderApprovedBy
      ? updated.lenderApprovedBy.toString()
      : null,
  };
}

export async function getPendingCollectionsService(db, session, lenderId) {
  const collections = await getPendingCollections(db, session, lenderId);
  return collections.map((c) => ({
    ...c,
    id: c._id.toString(),
    loanId: c.loanId ? c.loanId.toString() : null,
    emiId: c.emiId ? c.emiId.toString() : null,
    dealerId: c.dealerId ? c.dealerId.toString() : null,
    lenderId: c.lenderId ? c.lenderId.toString() : null,
    lenderApprovedBy: c.lenderApprovedBy ? c.lenderApprovedBy.toString() : null,
  }));
}
