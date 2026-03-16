import {
  generateEmiScheduleService,
  getEmiScheduleByLoanService,
  listEmisService,
  getEmiService
} from "./emi.services.js";
import { ROLES } from "../../utils/constants.js";

export async function generateEmiScheduleController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_GENERATE_EMI");
    }
    const result = await generateEmiScheduleService(db, session, req.params.loanId);
    return res.success(result, "EMI_SCHEDULE_GENERATED");
  } catch (err) {
    if (err.message === "LOAN_CONTRACT_NOT_FOUND") {
      return res.fail(404, "LOAN_CONTRACT_NOT_FOUND");
    }
    if (err.message === "LOAN_NOT_DISBURSED") {
      return res.fail(400, "LOAN_NOT_DISBURSED");
    }
    if (err.message === "EMI_SCHEDULE_ALREADY_EXISTS") {
      return res.fail(400, "EMI_SCHEDULE_ALREADY_EXISTS");
    }
    next(err);
  }
}

export async function getEmiScheduleByLoanController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const schedule = await getEmiScheduleByLoanService(db, session, req.params.loanId);
    return res.success(schedule, "EMI_SCHEDULE_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function listEmisController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const emis = await listEmisService(db, session, req.user);
    return res.success(emis, "EMIS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getEmiController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const emi = await getEmiService(db, session, req.params.emiId);
    if (!emi) return res.fail(404, "EMI_NOT_FOUND");
    return res.success(emi, "EMI_FETCHED");
  } catch (err) {
    next(err);
  }
}
