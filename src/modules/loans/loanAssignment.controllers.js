import {
  moveLoanToReviewService,
  assignLenderToLoanService
} from "./loanAssignment.services.js";
import { ROLES } from "../../utils/constants.js";

export async function moveLoanToReviewController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_MOVE_LOAN_TO_REVIEW");
    }
    const lenderId = req.body.lenderId || null;
    const result = await moveLoanToReviewService(db, session, req.params.loanId, lenderId);
    return res.success(result, "LOAN_MOVED_TO_REVIEW");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND") {
      return res.fail(404, "LOAN_NOT_FOUND");
    }
    if (err.message === "LOAN_CANNOT_BE_MOVED_TO_REVIEW") {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function assignLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_ASSIGN_LENDER");
    }
    const result = await assignLenderToLoanService(db, session, req.params.loanId, req.body.lenderId);
    return res.success(result, "LENDER_ASSIGNED");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND") {
      return res.fail(404, "LOAN_NOT_FOUND");
    }
    if (
      err.message === "LOAN_MUST_BE_IN_UNDER_REVIEW_TO_ASSIGN_LENDER" ||
      err.message === "LENDER_ALREADY_ASSIGNED"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}
