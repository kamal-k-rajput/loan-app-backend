import {
  getDisbursementReportService,
  getCollectionsReportService,
  getInterestIncomeReportService,
  getLoanPerformanceReportService,
  getNpaReportService
} from "./report.services.js";

export async function getDisbursementReportController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    const result = await getDisbursementReportService(db, session, req.user, filters);
    return res.success(result, "DISBURSEMENT_REPORT");
  } catch (err) {
    next(err);
  }
}

export async function getCollectionsReportController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    const result = await getCollectionsReportService(db, session, req.user, filters);
    return res.success(result, "COLLECTIONS_REPORT");
  } catch (err) {
    next(err);
  }
}

export async function getInterestIncomeReportController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    const result = await getInterestIncomeReportService(db, session, req.user, filters);
    return res.success(result, "INTEREST_INCOME_REPORT");
  } catch (err) {
    next(err);
  }
}

export async function getLoanPerformanceReportController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    const result = await getLoanPerformanceReportService(db, session, req.user, filters);
    return res.success(result, "LOAN_PERFORMANCE_REPORT");
  } catch (err) {
    next(err);
  }
}

export async function getNpaReportController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const filters = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    const result = await getNpaReportService(db, session, req.user, filters);
    return res.success(result, "NPA_REPORT");
  } catch (err) {
    next(err);
  }
}
