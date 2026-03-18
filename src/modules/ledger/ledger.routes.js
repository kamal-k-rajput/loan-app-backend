import express from "express";
import {
  createLedgerAccountController,
  listLedgerAccountsController,
  getLedgerAccountController,
  createLedgerEntryController,
  listLedgerEntriesController,
  getLedgerEntryController,
  getLedgerEntriesByLoanController,
  getLedgerEntriesByDealerController,
  getLedgerEntriesByLenderController
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
// Convenience routes for dealers and lenders to view their own ledger (must come before parameterized routes)
router.get("/dealer/my", requireAuth, getLedgerEntriesByDealerController);
router.get("/lender/my", requireAuth, getLedgerEntriesByLenderController);
router.get("/entries/dealer/:dealerId", requireAuth, getLedgerEntriesByDealerController);
router.get("/entries/lender/:lenderId", requireAuth, getLedgerEntriesByLenderController);

export const ledgerRouter = router;
