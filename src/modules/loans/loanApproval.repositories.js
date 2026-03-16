import { ObjectId } from "mongodb";
import { LOAN_APPLICATION_STATUS } from "../../utils/constants.js";

function loanApplicationsCollection(db) {
  return db.collection("loan_applications");
}

function loanContractsCollection(db) {
  return db.collection("loan_contracts");
}

export async function updateLoanStatus(db, session, loanId, status, data = {}) {
  const filter = { _id: new ObjectId(loanId) };
  const update = {
    $set: {
      status,
      ...data,
      updatedAt: new Date()
    }
  };
  const result = await loanApplicationsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return loanApplicationsCollection(db).findOne(filter, { session });
}

export async function createLoanContract(db, session, doc) {
  const result = await loanContractsCollection(db).insertOne(
    {
      ...doc,
      loanStatus: "APPROVED",
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, loanStatus: "APPROVED" };
}

export async function getPendingLoanApprovals(db, session, lenderId) {
  // If lenderId provided, show loans assigned to that lender OR unassigned loans
  // If no lenderId, show all loans in UNDER_REVIEW
  const query = {
    status: LOAN_APPLICATION_STATUS.UNDER_REVIEW
  };

  if (lenderId) {
    query.$or = [
      { lenderAssigned: new ObjectId(lenderId) },
      { lenderAssigned: { $exists: false } },
      { lenderAssigned: null }
    ];
  }

  return loanApplicationsCollection(db)
    .find(query, { session })
    .toArray();
}

export async function getLoanApplicationById(db, session, loanId) {
  return loanApplicationsCollection(db).findOne({ _id: new ObjectId(loanId) }, { session });
}
