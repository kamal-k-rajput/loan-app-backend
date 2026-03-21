import {
  applyLoanService,
  listLoansService,
  getLoanService,
  updateLoanService,
  cancelLoanService,
  getLoansByStatusService,
} from "./loan.services.js";
import { calculateEmiPreviewService } from "./loanPreview.services.js";
import { ROLES } from "../../utils/constants.js";

export async function calculateEmiPreviewController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_PREVIEW_EMI");
    }
    const result = await calculateEmiPreviewService(db, session, req.body);
    return res.success(result, "LOAN_EMI_PREVIEW");
  } catch (err) {
    if (err.message === "INTEREST_RATE_NOT_FOUND") {
      return res.fail(404, "INTEREST_RATE_NOT_FOUND");
    }
    next(err);
  }
}

export async function applyLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_APPLY_LOAN");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING");
    }
    const loan = await applyLoanService(
      db,
      session,
      req.body,
      req.user.dealerId,
    );
    return res.success(loan, "LOAN_APPLIED");
  } catch (err) {
    if (err.message === "CUSTOMER_NOT_FOUND_OR_NOT_ACCESSIBLE") {
      return res.fail(404, "CUSTOMER_NOT_FOUND_OR_NOT_ACCESSIBLE");
    }
    if (err.message === "LOAN_PRODUCT_NOT_FOUND") {
      return res.fail(404, "LOAN_PRODUCT_NOT_FOUND");
    }
    if (
      err.message === "LOAN_AMOUNT_OUT_OF_RANGE" ||
      err.message === "TENURE_OUT_OF_RANGE"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function listLoansController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const loans = await listLoansService(db, session, req.user);
    return res.success(loans, "LOANS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const loan = await getLoanService(db, session, req.params.loanId);
    if (!loan) return res.fail(404, "LOAN_NOT_FOUND");
    return res.success(loan, "LOAN_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.DEALER && req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_DEALER_OR_ADMIN_CAN_UPDATE_LOAN");
    }
    const loan = await updateLoanService(
      db,
      session,
      req.params.loanId,
      req.body,
      req.user,
    );
    return res.success(loan, "LOAN_UPDATED");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND") {
      return res.fail(404, "LOAN_NOT_FOUND");
    }
    if (
      err.message === "LOAN_CANNOT_BE_UPDATED" ||
      err.message === "CANNOT_UPDATE_OTHER_DEALER_LOAN"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function cancelLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.DEALER && req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_DEALER_OR_ADMIN_CAN_CANCEL_LOAN");
    }
    const ok = await cancelLoanService(
      db,
      session,
      req.params.loanId,
      req.user,
    );
    if (!ok) return res.fail(404, "LOAN_NOT_FOUND");
    return res.success(null, "LOAN_CANCELLED");
  } catch (err) {
    if (err.message === "LOAN_NOT_FOUND") {
      return res.fail(404, "LOAN_NOT_FOUND");
    }
    if (
      err.message === "DISBURSED_LOAN_CANNOT_BE_CANCELLED" ||
      err.message === "CANNOT_CANCEL_OTHER_DEALER_LOAN"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function getLoansByStatusController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const loans = await getLoansByStatusService(
      db,
      session,
      req.params.status,
      req.user,
    );
    return res.success(loans, "LOANS_BY_STATUS");
  } catch (err) {
    next(err);
  }
}
