import { ObjectId } from "mongodb";
import { LOAN_CONTRACT_STATUS } from "../../utils/constants.js";

function loanContractsCollection(db) {
  return db.collection("loan_contracts");
}

function disbursementsCollection(db) {
  return db.collection("disbursements");
}

export async function getLoanContractByApplicationId(db, session, loanApplicationId) {
  return loanContractsCollection(db).findOne(
    { loanApplicationId: new ObjectId(loanApplicationId) },
    { session }
  );
}

export async function updateLoanContract(db, session, contractId, updates) {
  const filter = { _id: new ObjectId(contractId) };
  const update = { $set: { ...updates, updatedAt: new Date() } };

  const result = await loanContractsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return loanContractsCollection(db).findOne(filter, { session });
}

export async function createDisbursement(db, session, doc) {
  const result = await disbursementsCollection(db).insertOne(
    {
      ...doc,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listDisbursements(db, session, filter = {}) {
  return disbursementsCollection(db)
    .find(filter, { session })
    .toArray();
}

export async function getDisbursementByLoanId(db, session, loanId) {
  return disbursementsCollection(db).findOne({ loanId: new ObjectId(loanId) }, { session });
}
