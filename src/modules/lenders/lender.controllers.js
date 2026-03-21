import {
  createLenderService,
  listLendersService,
  getLenderService,
  updateLenderService,
  deleteLenderService,
  lenderPortfolioService,
  lenderCollectionsService,
} from "./lender.services.js";
import { ROLES } from "../../utils/constants.js";

export async function createLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const lender = await createLenderService(db, session, req.body);
    return res.success(lender, "LENDER_CREATED");
  } catch (err) {
    next(err);
  }
}

export async function listLendersController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const { search } = req.query;
    const lenders = await listLendersService(db, session, { search });
    return res.success(lenders, "LENDERS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const lenderId =
      req.user && req.user.role === ROLES.LENDER
        ? req.user.lenderId
        : req.params.lenderId;
    const lender = await getLenderService(db, session, lenderId);
    if (!lender) return res.fail(404, "LENDER_NOT_FOUND");
    return res.success(lender, "LENDER_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const lenderId =
      req.user && req.user.role === ROLES.LENDER
        ? req.user.lenderId
        : req.params.lenderId;

    const lender = await updateLenderService(db, session, lenderId, req.body);
    if (!lender) return res.fail(404, "LENDER_NOT_FOUND");
    return res.success(lender, "LENDER_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const lenderId =
      req.user && req.user.role === ROLES.LENDER
        ? req.user.lenderId
        : req.params.lenderId;
    const ok = await deleteLenderService(db, session, lenderId);
    if (!ok) return res.fail(404, "LENDER_NOT_FOUND");
    return res.success(null, "LENDER_DELETED");
  } catch (err) {
    next(err);
  }
}

export async function lenderPortfolioController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const lenderId =
      req.user && req.user.role === ROLES.LENDER
        ? req.user.lenderId
        : req.params.lenderId;
    const portfolio = await lenderPortfolioService(db, session, lenderId);
    return res.success(portfolio, "LENDER_PORTFOLIO");
  } catch (err) {
    next(err);
  }
}

export async function lenderCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const lenderId =
      req.user && req.user.role === ROLES.LENDER
        ? req.user.lenderId
        : req.params.lenderId;
    const collections = await lenderCollectionsService(db, session, lenderId);
    return res.success(collections, "LENDER_COLLECTIONS");
  } catch (err) {
    next(err);
  }
}
