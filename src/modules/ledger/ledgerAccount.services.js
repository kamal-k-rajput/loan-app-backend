import {
  createLedgerAccount,
  listLedgerAccounts,
  getLedgerAccountById
} from "./ledgerAccount.repositories.js";
import { LEDGER_ACCOUNT_TYPES } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function createLedgerAccountService(db, session, payload) {
  const { accountName, accountType, ownerId, ownerType } = payload;

  // Check if account with same name and owner already exists
  const existing = await listLedgerAccounts(db, session, {
    accountName,
    accountType,
    ownerId: ownerId ? new ObjectId(ownerId) : null
  });

  if (existing.length > 0) {
    throw new Error("ACCOUNT_ALREADY_EXISTS");
  }

  const account = await createLedgerAccount(db, session, {
    accountName,
    accountType,
    ownerId: ownerId ? new ObjectId(ownerId) : null,
    ownerType: ownerType || "system"
  });

  return {
    ...account,
    id: account._id.toString(),
    ownerId: account.ownerId ? account.ownerId.toString() : null
  };
}

export async function listLedgerAccountsService(db, session, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    filter.accountType = LEDGER_ACCOUNT_TYPES.DEALER_COMMISSION_ACCOUNT;
    filter.ownerId = new ObjectId(user.dealerId);
  } else if (user.role === "LENDER" && user.lenderId) {
    filter.accountType = LEDGER_ACCOUNT_TYPES.LENDER_SETTLEMENT_ACCOUNT;
    filter.ownerId = new ObjectId(user.lenderId);
  }

  const accounts = await listLedgerAccounts(db, session, filter);
  return accounts.map((a) => ({
    ...a,
    id: a._id.toString(),
    ownerId: a.ownerId ? a.ownerId.toString() : null
  }));
}

export async function getLedgerAccountService(db, session, accountId) {
  const account = await getLedgerAccountById(db, session, accountId);
  if (!account) return null;
  return {
    ...account,
    id: account._id.toString(),
    ownerId: account.ownerId ? account.ownerId.toString() : null
  };
}
