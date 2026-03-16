import {
  approveLoanService,
  rejectLoanService,
  getPendingLoanApprovalsService
} from "./loanApproval.services.js";
import { ROLES } from "../../utils/constants.js";

export async function approveLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_APPROVE_LOAN");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await approveLoanService(db, session, req.params.loanId, req.user.lenderId, req.body);
    return res.success(result, "LOAN_APPROVED");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND") {
      return res.fail(404, "LOAN_NOT_FOUND");
    }
    if (err.message === "LOAN_NOT_IN_REVIEW") {
      return res.fail(400, "LOAN_NOT_IN_REVIEW");
    }
    if (err.message === "LOAN_ALREADY_ASSIGNED_TO_ANOTHER_LENDER") {
      return res.fail(403, "LOAN_ALREADY_ASSIGNED_TO_ANOTHER_LENDER");
    }
    next(err);
  }
}

export async function rejectLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_REJECT_LOAN");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await rejectLoanService(db, session, req.params.loanId, req.user.lenderId, req.body.reason);
    return res.success(result, "LOAN_REJECTED");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND") {
      return res.fail(404, "LOAN_NOT_FOUND");
    }
    if (err.message === "LOAN_NOT_IN_REVIEW") {
      return res.fail(400, "LOAN_NOT_IN_REVIEW");
    }
    next(err);
  }
}

export async function getPendingLoanApprovalsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_VIEW_APPROVALS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const loans = await getPendingLoanApprovalsService(db, session, req.user.lenderId);
    return res.success(loans, "PENDING_LOAN_APPROVALS");
  } catch (err) {
    next(err);
  }
}
