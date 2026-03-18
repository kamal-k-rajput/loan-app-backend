import { ObjectId } from "mongodb";

function ledgerEntriesCollection(db) {
  return db.collection("ledger_entries");
}

function ledgerTransactionsCollection(db) {
  return db.collection("ledger_transactions");
}

export async function createLedgerEntry(db, session, doc) {
  const result = await ledgerEntriesCollection(db).insertOne(
    {
      ...doc,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function createLedgerTransaction(db, session, doc) {
  const result = await ledgerTransactionsCollection(db).insertOne(
    {
      ...doc,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc };
}

export async function listLedgerEntries(db, session, filter = {}) {
  return ledgerEntriesCollection(db)
    .find(filter, { session })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getLedgerEntryById(db, session, entryId) {
  return ledgerEntriesCollection(db).findOne({ _id: new ObjectId(entryId) }, { session });
}

export async function getLedgerEntriesByLoanId(db, session, loanId) {
  return ledgerEntriesCollection(db)
    .find(
      {
        referenceType: "loan",
        referenceId: new ObjectId(loanId)
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getTransactionsByEntryId(db, session, entryId) {
  return ledgerTransactionsCollection(db)
    .find({ entryId: new ObjectId(entryId) }, { session })
    .toArray();
}

export async function getLedgerEntriesByDealerId(db, session, dealerId) {
  // Get all loans for this dealer
  const loans = await db
    .collection("loan_applications")
    .find({ dealerId: new ObjectId(dealerId) }, { session })
    .toArray();
  
  const loanIds = loans.map((l) => new ObjectId(l._id));
  
  if (loanIds.length === 0) {
    return [];
  }
  
  return ledgerEntriesCollection(db)
    .find(
      {
        referenceType: "loan",
        referenceId: { $in: loanIds }
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getLedgerEntriesByLenderId(db, session, lenderId) {
  // Get all loan contracts for this lender
  const contracts = await db
    .collection("loan_contracts")
    .find({ lenderId: new ObjectId(lenderId) }, { session })
    .toArray();
  
  const loanApplicationIds = contracts.map((c) => new ObjectId(c.loanApplicationId));
  
  if (loanApplicationIds.length === 0) {
    return [];
  }
  
  return ledgerEntriesCollection(db)
    .find(
      {
        referenceType: "loan",
        referenceId: { $in: loanApplicationIds }
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .toArray();
}
