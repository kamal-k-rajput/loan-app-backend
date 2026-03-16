import {
  getNpaByDaysService,
  getNpaLoansService
} from "./npa.services.js";

export async function getNpa30DaysController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await getNpaByDaysService(db, session, 30, req.user);
    return res.success(result, "NPA_30_DAYS");
  } catch (err) {
    next(err);
  }
}

export async function getNpa60DaysController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await getNpaByDaysService(db, session, 60, req.user);
    return res.success(result, "NPA_60_DAYS");
  } catch (err) {
    next(err);
  }
}

export async function getNpa90DaysController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await getNpaByDaysService(db, session, 90, req.user);
    return res.success(result, "NPA_90_DAYS");
  } catch (err) {
    next(err);
  }
}

export async function getNpaLoansController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const loans = await getNpaLoansService(db, session, req.user);
    return res.success(loans, "NPA_LOANS");
  } catch (err) {
    next(err);
  }
}
