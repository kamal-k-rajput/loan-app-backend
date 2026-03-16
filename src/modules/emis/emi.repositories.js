import { ObjectId } from "mongodb";
import { EMI_STATUS } from "../../utils/constants.js";

function emiScheduleCollection(db) {
  return db.collection("emi_schedule");
}

function loanContractsCollection(db) {
  return db.collection("loan_contracts");
}

export async function getLoanContractById(db, session, contractId) {
  return loanContractsCollection(db).findOne({ _id: new ObjectId(contractId) }, { session });
}

export async function getLoanContractByApplicationId(db, session, loanApplicationId) {
  return loanContractsCollection(db).findOne(
    { loanApplicationId: new ObjectId(loanApplicationId) },
    { session }
  );
}

export async function createEmiSchedule(db, session, emiRecords) {
  if (emiRecords.length === 0) return [];
  const result = await emiScheduleCollection(db).insertMany(emiRecords, { session });
  return emiRecords.map((emi, index) => ({
    ...emi,
    _id: result.insertedIds[index]
  }));
}

export async function getEmiScheduleByLoanId(db, session, loanId) {
  return emiScheduleCollection(db)
    .find({ loanId: new ObjectId(loanId) }, { session })
    .sort({ emiNumber: 1 })
    .toArray();
}

export async function listEmis(db, session, filter = {}) {
  return emiScheduleCollection(db)
    .find(filter, { session })
    .sort({ dueDate: 1 })
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
