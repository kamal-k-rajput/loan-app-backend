import express from "express";
import {
  applyLoanController,
  calculateEmiPreviewController,
  listLoansController,
  getLoanController,
  updateLoanController,
  cancelLoanController,
  getLoansByStatusController,
} from "./loan.controllers.js";
import {
  approveLoanController,
  rejectLoanController,
} from "./loanApproval.controllers.js";
import {
  disburseLoanController,
  listDisbursementsController,
  getDisbursementByLoanController,
} from "./disbursement.controllers.js";
import { applyLoanSchema, updateLoanSchema } from "./loan.validators.js";
import { calculateEmiPreviewSchema } from "./loanPreview.validators.js";
import {
  approveLoanSchema,
  rejectLoanSchema,
} from "./loanApproval.validators.js";
import { disburseLoanSchema } from "./disbursement.validators.js";
import { validateBody } from "../../shared/validate.js";
import { requireAuth, requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.post(
  "/apply",
  requireRole(ROLES.DEALER),
  validateBody(applyLoanSchema),
  applyLoanController,
);
router.post(
  "/calculate-emi-preview",
  requireRole(ROLES.DEALER),
  validateBody(calculateEmiPreviewSchema),
  calculateEmiPreviewController,
);
router.get("/", requireAuth, listLoansController);
router.get("/:loanId", requireAuth, getLoanController);
router.put(
  "/:loanId/update",
  requireAuth,
  validateBody(updateLoanSchema),
  updateLoanController,
);
router.delete("/:loanId/cancel", requireAuth, cancelLoanController);
router.get("/status/:status", requireAuth, getLoansByStatusController);

// Loan approval routes
router.put(
  "/:loanId/approve",
  requireRole(ROLES.LENDER),
  validateBody(approveLoanSchema),
  approveLoanController,
);
router.put(
  "/:loanId/reject",
  requireRole(ROLES.LENDER),
  validateBody(rejectLoanSchema),
  rejectLoanController,
);
router.post(
  "/:loanId/disburse",
  requireRole(ROLES.LENDER),
  validateBody(disburseLoanSchema),
  disburseLoanController,
);

// EMI schedule routes
import {
  getEmiScheduleByLoanController as getLoanEmiSchedule,
  generateEmiScheduleController as generateLoanEmi,
} from "../emis/emi.controllers.js";

// EMI schedule routes
router.get("/:loanId/emi-schedule", requireAuth, getLoanEmiSchedule);
router.post("/:loanId/generate-emi", requireAuth, generateLoanEmi);

// Prepayment routes
import {
  calculatePrepaymentController,
  processPrepaymentController,
} from "./prepayment.controllers.js";
import { prepaymentSchema } from "./prepayment.validators.js";

router.get(
  "/:loanId/prepayment-calc",
  requireAuth,
  calculatePrepaymentController,
);
router.post(
  "/:loanId/prepayment",
  requireAuth,
  validateBody(prepaymentSchema),
  processPrepaymentController,
);

// Lender assignment routes (Admin only)
import {
  moveLoanToReviewController,
  assignLenderController,
} from "./loanAssignment.controllers.js";
import {
  moveToReviewSchema,
  assignLenderSchema,
} from "./loanAssignment.validators.js";

router.put(
  "/:loanId/move-to-review",
  requireRole(ROLES.ADMIN),
  validateBody(moveToReviewSchema),
  moveLoanToReviewController,
);
router.put(
  "/:loanId/assign-lender",
  requireRole(ROLES.ADMIN),
  validateBody(assignLenderSchema),
  assignLenderController,
);

export const loanRouter = router;
