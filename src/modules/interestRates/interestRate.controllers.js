import {
  createInterestRateService,
  listInterestRatesService,
  getInterestRateService,
  getInterestRatesByLenderService,
  updateInterestRateService,
  deleteInterestRateService
} from "./interestRate.services.js";
import { ROLES } from "../../utils/constants.js";

export async function createInterestRateController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    let lenderId;
    if (req.user.role === ROLES.ADMIN) {
      if (!req.body.lenderId) {
        return res.fail(400, "LENDER_ID_REQUIRED_FOR_ADMIN");
      }
      lenderId = req.body.lenderId;
    } else if (req.user.role === ROLES.LENDER) {
      if (!req.user.lenderId) {
        return res.fail(400, "LENDER_ID_MISSING");
      }
      lenderId = req.user.lenderId;
    } else {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_CREATE_RATE");
    }

    const rate = await createInterestRateService(db, session, req.body, lenderId);
    return res.success(rate, "INTEREST_RATE_CREATED");
  } catch (err) {
    next(err);
  }
}

export async function listInterestRatesController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_LIST_ALL_RATES");
    }
    const rates = await listInterestRatesService(db, session);
    return res.success(rates, "INTEREST_RATES_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getInterestRateController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const rate = await getInterestRateService(db, session, req.params.rateId);
    if (!rate) return res.fail(404, "INTEREST_RATE_NOT_FOUND");
    return res.success(rate, "INTEREST_RATE_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateInterestRateController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    // Check if user owns this rate (for lenders)
    if (req.user.role === ROLES.LENDER) {
      const rate = await getInterestRateService(db, session, req.params.rateId);
      if (!rate) return res.fail(404, "INTEREST_RATE_NOT_FOUND");
      if (rate.lenderId !== req.user.lenderId) {
        return res.fail(403, "CANNOT_UPDATE_OTHER_LENDER_RATE");
      }
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_UPDATE_RATE");
    }

    const rate = await updateInterestRateService(db, session, req.params.rateId, req.body);
    if (!rate) return res.fail(404, "INTEREST_RATE_NOT_FOUND");
    return res.success(rate, "INTEREST_RATE_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteInterestRateController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    // Check if user owns this rate (for lenders)
    if (req.user.role === ROLES.LENDER) {
      const rate = await getInterestRateService(db, session, req.params.rateId);
      if (!rate) return res.fail(404, "INTEREST_RATE_NOT_FOUND");
      if (rate.lenderId !== req.user.lenderId) {
        return res.fail(403, "CANNOT_DELETE_OTHER_LENDER_RATE");
      }
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_DELETE_RATE");
    }

    const ok = await deleteInterestRateService(db, session, req.params.rateId);
    if (!ok) return res.fail(404, "INTEREST_RATE_NOT_FOUND");
    return res.success(null, "INTEREST_RATE_DELETED");
  } catch (err) {
    next(err);
  }
}

export async function getInterestRatesByLenderController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    let lenderId = req.params.lenderId;
    if (req.user.role === ROLES.LENDER) {
      lenderId = req.user.lenderId;
    } else if (req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_VIEW_RATES");
    }

    const rates = await getInterestRatesByLenderService(db, session, lenderId);
    return res.success(rates, "LENDER_INTEREST_RATES");
  } catch (err) {
    next(err);
  }
}
