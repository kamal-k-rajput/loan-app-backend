import { ObjectId } from "mongodb";

function loanContractsCollection(db) {
  return db.collection("loan_contracts");
}

function emiScheduleCollection(db) {
  return db.collection("emi_schedule");
}

function prepaymentsCollection(db) {
  return db.collection("prepayments");
}

export async function getLoanContractByApplicationId(db, session, loanApplicationId) {
  return loanContractsCollection(db).findOne(
    { loanApplicationId: new ObjectId(loanApplicationId) },
    { session }
  );
}

export async function getPendingEmisByLoanId(db, session, loanId) {
  return emiScheduleCollection(db)
    .find(
      {
        loanId: new ObjectId(loanId),
        status: { $in: ["PENDING", "OVERDUE", "PARTIAL"] }
      },
      { session }
    )
    .sort({ emiNumber: 1 })
    .toArray();
}

export async function deleteEmisByLoanId(db, session, loanId) {
  return emiScheduleCollection(db).deleteMany(
    {
      loanId: new ObjectId(loanId),
      status: { $in: ["PENDING", "OVERDUE", "PARTIAL"] }
    },
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

export async function updateLoanContractPrincipal(db, session, contractId, newPrincipal) {
  const filter = { _id: new ObjectId(contractId) };
  const update = {
    $set: {
      principalAmount: newPrincipal,
      updatedAt: new Date()
    }
  };
  const result = await loanContractsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return loanContractsCollection(db).findOne(filter, { session });
}

export async function createPrepaymentRecord(db, session, doc) {
  const result = await prepaymentsCollection(db).insertOne(
    {
      ...doc,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}
