import express from "express";
import {
  createLedgerAccountController,
  listLedgerAccountsController,
  getLedgerAccountController,
  createLedgerEntryController,
  listLedgerEntriesController,
  getLedgerEntryController,
  getLedgerEntriesByLoanController
} from "./ledger.controllers.js";
import { createLedgerAccountSchema } from "./ledgerAccount.validators.js";
import { createLedgerEntrySchema } from "./ledgerEntry.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Ledger Accounts
router.post("/accounts", requireAuth, validateBody(createLedgerAccountSchema), createLedgerAccountController);
router.get("/accounts", requireAuth, listLedgerAccountsController);
router.get("/accounts/:accountId", requireAuth, getLedgerAccountController);

// Ledger Entries
router.post("/entries", requireAuth, validateBody(createLedgerEntrySchema), createLedgerEntryController);
router.get("/entries", requireAuth, listLedgerEntriesController);
router.get("/entries/:entryId", requireAuth, getLedgerEntryController);
router.get("/entries/loan/:loanId", requireAuth, getLedgerEntriesByLoanController);

export const ledgerRouter = router;
