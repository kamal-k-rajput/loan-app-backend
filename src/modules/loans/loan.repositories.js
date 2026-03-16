import { ObjectId } from "mongodb";
import { LOAN_APPLICATION_STATUS } from "../../utils/constants.js";

function loanApplicationsCollection(db) {
  return db.collection("loan_applications");
}

export async function createLoanApplication(db, session, doc) {
  const result = await loanApplicationsCollection(db).insertOne(
    {
      ...doc,
      status: LOAN_APPLICATION_STATUS.APPLIED,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, status: LOAN_APPLICATION_STATUS.APPLIED };
}

export async function listLoanApplications(db, session, filter = {}) {
  return loanApplicationsCollection(db)
    .find(filter, { session })
    .toArray();
}

export async function getLoanApplicationById(db, session, loanId) {
  return loanApplicationsCollection(db).findOne({ _id: new ObjectId(loanId) }, { session });
}

export async function updateLoanApplication(db, session, loanId, updates) {
  const filter = { _id: new ObjectId(loanId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await loanApplicationsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }

  return loanApplicationsCollection(db).findOne(filter, { session });
}

export async function deleteLoanApplication(db, session, loanId) {
  const result = await loanApplicationsCollection(db).deleteOne({ _id: new ObjectId(loanId) }, { session });
  return result.deletedCount > 0;
}

export async function getLoanApplicationsByStatus(db, session, status, filter = {}) {
  const query = { status, ...filter };
  return loanApplicationsCollection(db)
    .find(query, { session })
    .toArray();
}
