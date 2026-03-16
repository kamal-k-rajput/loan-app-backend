import {
  createLedgerEntry,
  createLedgerTransaction,
  listLedgerEntries,
  getLedgerEntryById,
  getLedgerEntriesByLoanId,
  getTransactionsByEntryId
} from "./ledgerEntry.repositories.js";
import { updateLedgerAccountBalance, getLedgerAccountById } from "./ledgerAccount.repositories.js";
import { LEDGER_TRANSACTION_TYPES } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function createLedgerEntryService(db, session, payload) {
  const { referenceType, referenceId, description, transactions } = payload;

  // Validate all accounts exist
  for (const transaction of transactions) {
    const account = await getLedgerAccountById(db, session, transaction.accountId);
    if (!account) {
      throw new Error(`ACCOUNT_NOT_FOUND_${transaction.accountId}`);
    }
  }

  // Create ledger entry
  const entry = await createLedgerEntry(db, session, {
    referenceType,
    referenceId: new ObjectId(referenceId),
    description
  });

  // Create transactions and update account balances
  const createdTransactions = [];
  for (const transaction of transactions) {
    const ledgerTransaction = await createLedgerTransaction(db, session, {
      entryId: entry._id,
      accountId: new ObjectId(transaction.accountId),
      type: transaction.type,
      amount: transaction.amount
    });

    // Update account balance
    await updateLedgerAccountBalance(
      db,
      session,
      transaction.accountId,
      transaction.amount,
      transaction.type === LEDGER_TRANSACTION_TYPES.DEBIT
    );

    createdTransactions.push({
      ...ledgerTransaction,
      id: ledgerTransaction._id.toString(),
      entryId: ledgerTransaction.entryId.toString(),
      accountId: ledgerTransaction.accountId.toString()
    });
  }

  return {
    ...entry,
    id: entry._id.toString(),
    referenceId: entry.referenceId.toString(),
    transactions: createdTransactions
  };
}

export async function listLedgerEntriesService(db, session, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    // Get loans for this dealer
    const loans = await db
      .collection("loan_applications")
      .find({ dealerId: new ObjectId(user.dealerId) }, { session })
      .toArray();
    const loanIds = loans.map((l) => l._id);
    filter.referenceId = { $in: loanIds.map((id) => new ObjectId(id)) };
    filter.referenceType = "loan";
  } else if (user.role === "LENDER" && user.lenderId) {
    // Get contracts for this lender
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    filter.referenceId = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
    filter.referenceType = "loan";
  }

  const entries = await listLedgerEntries(db, session, filter);
  const entriesWithTransactions = await Promise.all(
    entries.map(async (entry) => {
      const transactions = await getTransactionsByEntryId(db, session, entry._id);
      return {
        ...entry,
        id: entry._id.toString(),
        referenceId: entry.referenceId.toString(),
        transactions: transactions.map((t) => ({
          ...t,
          id: t._id.toString(),
          entryId: t.entryId.toString(),
          accountId: t.accountId.toString()
        }))
      };
    })
  );

  return entriesWithTransactions;
}

export async function getLedgerEntryService(db, session, entryId) {
  const entry = await getLedgerEntryById(db, session, entryId);
  if (!entry) return null;

  const transactions = await getTransactionsByEntryId(db, session, entryId);
  return {
    ...entry,
    id: entry._id.toString(),
    referenceId: entry.referenceId.toString(),
    transactions: transactions.map((t) => ({
      ...t,
      id: t._id.toString(),
      entryId: t.entryId.toString(),
      accountId: t.accountId.toString()
    }))
  };
}

export async function getLedgerEntriesByLoanService(db, session, loanId) {
  const entries = await getLedgerEntriesByLoanId(db, session, loanId);
  const entriesWithTransactions = await Promise.all(
    entries.map(async (entry) => {
      const transactions = await getTransactionsByEntryId(db, session, entry._id);
      return {
        ...entry,
        id: entry._id.toString(),
        referenceId: entry.referenceId.toString(),
        transactions: transactions.map((t) => ({
          ...t,
          id: t._id.toString(),
          entryId: t.entryId.toString(),
          accountId: t.accountId.toString()
        }))
      };
    })
  );

  return entriesWithTransactions;
}
