import {
  calculatePrepaymentService,
  processPrepaymentService
} from "./prepayment.services.js";
import { ROLES } from "../../utils/constants.js";

export async function calculatePrepaymentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await calculatePrepaymentService(db, session, req.params.loanId);
    return res.success(result, "PREPAYMENT_CALCULATED");
  } catch (err) {
    if (err.message === "LOAN_CONTRACT_NOT_FOUND") {
      return res.fail(404, "LOAN_CONTRACT_NOT_FOUND");
    }
    if (err.message === "LOAN_NOT_ACTIVE") {
      return res.fail(400, "LOAN_NOT_ACTIVE");
    }
    next(err);
  }
}

export async function processPrepaymentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await processPrepaymentService(db, session, req.params.loanId, req.body);
    return res.success(result, "PREPAYMENT_PROCESSED");
  } catch (err) {
    if (err.message === "LOAN_CONTRACT_NOT_FOUND") {
      return res.fail(404, "LOAN_CONTRACT_NOT_FOUND");
    }
    if (
      err.message === "LOAN_NOT_ACTIVE" ||
      err.message === "NO_PENDING_EMIS" ||
      err.message === "PREPAYMENT_AMOUNT_EXCEEDS_REMAINING_PRINCIPAL"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}
