import {
  createDealerService,
  listDealersService,
  getDealerService,
  updateDealerService,
  deleteDealerService,
  dealerLoansService,
  dealerCollectionsService,
  dealerEarningsService
} from "./dealer.services.js";
import { ROLES } from "../../utils/constants.js";

export async function createDealerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealer = await createDealerService(db, session, req.body);
    return res.success(dealer, "DEALER_CREATED");
  } catch (err) {
    next(err);
  }
}

export async function listDealersController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const { search } = req.query;
    const dealers = await listDealersService(db, session, { search });
    return res.success(dealers, "DEALERS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getDealerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealerId =
      req.user && req.user.role === ROLES.DEALER ? req.user.dealerId : req.params.dealerId;
    const dealer = await getDealerService(db, session, dealerId);
    if (!dealer) return res.fail(404, "DEALER_NOT_FOUND");
    return res.success(dealer, "DEALER_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateDealerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealerId =
      req.user && req.user.role === ROLES.DEALER ? req.user.dealerId : req.params.dealerId;
    const dealer = await updateDealerService(db, session, dealerId, req.body);
    if (!dealer) return res.fail(404, "DEALER_NOT_FOUND");
    return res.success(dealer, "DEALER_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteDealerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealerId =
      req.user && req.user.role === ROLES.DEALER ? req.user.dealerId : req.params.dealerId;
    const ok = await deleteDealerService(db, session, dealerId);
    if (!ok) return res.fail(404, "DEALER_NOT_FOUND");
    return res.success(null, "DEALER_DELETED");
  } catch (err) {
    next(err);
  }
}

export async function dealerLoansController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealerId =
      req.user && req.user.role === ROLES.DEALER ? req.user.dealerId : req.params.dealerId;
    const loans = await dealerLoansService(db, session, dealerId);
    return res.success(loans, "DEALER_LOANS");
  } catch (err) {
    next(err);
  }
}

export async function dealerCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealerId =
      req.user && req.user.role === ROLES.DEALER ? req.user.dealerId : req.params.dealerId;
    const collections = await dealerCollectionsService(db, session, dealerId);
    return res.success(collections, "DEALER_COLLECTIONS");
  } catch (err) {
    next(err);
  }
}

export async function dealerEarningsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const dealerId =
      req.user && req.user.role === ROLES.DEALER ? req.user.dealerId : req.params.dealerId;
    const earnings = await dealerEarningsService(db, session, dealerId);
    return res.success(earnings, "DEALER_EARNINGS");
  } catch (err) {
    next(err);
  }
}

