import {
  disburseLoanService,
  listDisbursementsService,
  getDisbursementByLoanService
} from "./disbursement.services.js";
import { ROLES } from "../../utils/constants.js";

export async function disburseLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_DISBURSE_LOAN");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await disburseLoanService(db, session, req.params.loanId, req.body);
    return res.success(result, "LOAN_DISBURSED");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND" || err.message === "LOAN_CONTRACT_NOT_FOUND") {
      return res.fail(404, err.message);
    }
    if (err.message === "LOAN_NOT_APPROVED" || err.message === "CONTRACT_NOT_APPROVED") {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function listDisbursementsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const disbursements = await listDisbursementsService(db, session, req.user);
    return res.success(disbursements, "DISBURSEMENTS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getDisbursementByLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const disbursement = await getDisbursementByLoanService(db, session, req.params.loanId);
    if (!disbursement) return res.fail(404, "DISBURSEMENT_NOT_FOUND");
    return res.success(disbursement, "DISBURSEMENT_FETCHED");
  } catch (err) {
    next(err);
  }
}
