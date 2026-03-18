import {
  createLedgerAccountService,
  listLedgerAccountsService,
  getLedgerAccountService
} from "./ledgerAccount.services.js";
import {
  createLedgerEntryService,
  listLedgerEntriesService,
  getLedgerEntryService,
  getLedgerEntriesByLoanService,
  getLedgerEntriesByDealerService,
  getLedgerEntriesByLenderService
} from "./ledgerEntry.services.js";
import { ROLES } from "../../utils/constants.js";

// Ledger Account Controllers
export async function createLedgerAccountController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_CREATE_ACCOUNT");
    }
    const account = await createLedgerAccountService(db, session, req.body);
    return res.success(account, "LEDGER_ACCOUNT_CREATED");
  } catch (err) {
    if (err.message === "ACCOUNT_ALREADY_EXISTS") {
      return res.fail(400, "ACCOUNT_ALREADY_EXISTS");
    }
    next(err);
  }
}

export async function listLedgerAccountsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const accounts = await listLedgerAccountsService(db, session, req.user);
    return res.success(accounts, "LEDGER_ACCOUNTS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getLedgerAccountController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const account = await getLedgerAccountService(db, session, req.params.accountId);
    if (!account) return res.fail(404, "LEDGER_ACCOUNT_NOT_FOUND");
    return res.success(account, "LEDGER_ACCOUNT_FETCHED");
  } catch (err) {
    next(err);
  }
}

// Ledger Entry Controllers
export async function createLedgerEntryController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_CREATE_LEDGER_ENTRY");
    }
    const result = await createLedgerEntryService(db, session, req.body);
    return res.success(result, "LEDGER_ENTRY_CREATED");
  } catch (err) {
    if (err.message && err.message.startsWith("ACCOUNT_NOT_FOUND_")) {
      return res.fail(404, "LEDGER_ACCOUNT_NOT_FOUND");
    }
    if (err.message === "DEBIT_AND_CREDIT_MUST_BALANCE") {
      return res.fail(400, "DEBIT_AND_CREDIT_MUST_BALANCE");
    }
    next(err);
  }
}

export async function listLedgerEntriesController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const entries = await listLedgerEntriesService(db, session, req.user);
    return res.success(entries, "LEDGER_ENTRIES_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getLedgerEntryController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const entry = await getLedgerEntryService(db, session, req.params.entryId);
    if (!entry) return res.fail(404, "LEDGER_ENTRY_NOT_FOUND");
    return res.success(entry, "LEDGER_ENTRY_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function getLedgerEntriesByLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const entries = await getLedgerEntriesByLoanService(db, session, req.params.loanId);
    return res.success(entries, "LEDGER_ENTRIES_BY_LOAN");
  } catch (err) {
    next(err);
  }
}

export async function getLedgerEntriesByDealerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    let dealerId = req.params.dealerId;
    
    // If route is /dealer/my or user is a dealer, use their own dealerId
    if (!dealerId || req.user.role === ROLES.DEALER) {
      if (!req.user.dealerId) {
        return res.fail(400, "DEALER_ID_MISSING", "Dealer user is not linked to a dealer");
      }
      dealerId = req.user.dealerId;
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_OR_DEALER_CAN_VIEW_DEALER_LEDGER");
    }

    if (!dealerId) {
      return res.fail(400, "DEALER_ID_REQUIRED", "Dealer ID is required");
    }

    const entries = await getLedgerEntriesByDealerService(db, session, dealerId);
    return res.success(entries, "LEDGER_ENTRIES_BY_DEALER");
  } catch (err) {
    next(err);
  }
}

export async function getLedgerEntriesByLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    let lenderId = req.params.lenderId;
    
    // If route is /lender/my or user is a lender, use their own lenderId
    if (!lenderId || req.user.role === ROLES.LENDER) {
      if (!req.user.lenderId) {
        return res.fail(400, "LENDER_ID_MISSING", "Lender user is not linked to a lender");
      }
      lenderId = req.user.lenderId;
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_VIEW_LENDER_LEDGER");
    }

    if (!lenderId) {
      return res.fail(400, "LENDER_ID_REQUIRED", "Lender ID is required");
    }

    const entries = await getLedgerEntriesByLenderService(db, session, lenderId);
    return res.success(entries, "LEDGER_ENTRIES_BY_LENDER");
  } catch (err) {
    next(err);
  }
}
