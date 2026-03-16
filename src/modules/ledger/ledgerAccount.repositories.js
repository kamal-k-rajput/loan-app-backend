import { ObjectId } from "mongodb";

function ledgerAccountsCollection(db) {
  return db.collection("ledger_accounts");
}

export async function createLedgerAccount(db, session, doc) {
  const result = await ledgerAccountsCollection(db).insertOne(
    {
      ...doc,
      balance: 0,
      createdAt: new Date()
    },
    { session }
  );
  return { _id: result.insertedId, ...doc, balance: 0 };
}

export async function listLedgerAccounts(db, session, filter = {}) {
  return ledgerAccountsCollection(db)
    .find(filter, { session })
    .toArray();
}

export async function getLedgerAccountById(db, session, accountId) {
  return ledgerAccountsCollection(db).findOne({ _id: new ObjectId(accountId) }, { session });
}

export async function updateLedgerAccountBalance(db, session, accountId, amount, isDebit) {
  const filter = { _id: new ObjectId(accountId) };
  
  // Get account to determine account type for proper balance calculation
  const account = await ledgerAccountsCollection(db).findOne(filter, { session });
  if (!account) {
    return null;
  }

  // Determine account category for proper double-entry balance calculation
  // Asset accounts: Debit increases, Credit decreases
  // Liability/Income accounts: Debit decreases, Credit increases
  const assetAccounts = [
    "CUSTOMER_LOAN_ACCOUNT",
    "PRINCIPAL_RECEIVABLE_ACCOUNT",
    "CASH_COLLECTION_ACCOUNT",
    "PAYMENT_GATEWAY_ACCOUNT"
  ];
  
  const liabilityIncomeAccounts = [
    "LENDER_SETTLEMENT_ACCOUNT",
    "INTEREST_INCOME_ACCOUNT",
    "DEALER_COMMISSION_ACCOUNT"
  ];

  let balanceChange;
  if (assetAccounts.includes(account.accountType)) {
    // Asset: Debit increases, Credit decreases
    balanceChange = isDebit ? amount : -amount;
  } else if (liabilityIncomeAccounts.includes(account.accountType)) {
    // Liability/Income: Debit decreases, Credit increases
    balanceChange = isDebit ? -amount : amount;
  } else {
    // Default to asset behavior if account type not recognized
    balanceChange = isDebit ? amount : -amount;
  }

  const update = { $inc: { balance: balanceChange } };
  const result = await ledgerAccountsCollection(db).updateOne(filter, update, { session });
  if (result.matchedCount === 0) {
    return null;
  }
  return ledgerAccountsCollection(db).findOne(filter, { session });
}
