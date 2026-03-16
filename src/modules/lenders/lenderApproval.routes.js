import express from "express";
import { getPendingLoanApprovalsController } from "../loans/loanApproval.controllers.js";
import { requireRole } from "../../middleware/authMiddleware.js";
import { ROLES } from "../../utils/constants.js";

const router = express.Router();

router.get("/loan-approvals", requireRole(ROLES.LENDER), getPendingLoanApprovalsController);

export const lenderApprovalRouter = router;
