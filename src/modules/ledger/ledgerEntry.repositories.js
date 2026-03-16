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
