import {
  getAdminOverviewService,
  getAdminDisbursementService,
  getAdminCollectionsService,
  getAdminNpaService,
} from "./adminDashboard.services.js";
import {
  getLenderPortfolioService,
  getLenderDisbursementService,
  getLenderOutstandingService,
  getLenderNpaService,
  getLenderPendingCollectionsService,
} from "./lenderDashboard.services.js";
import {
  getDealerSalesFunnelService,
  getDealerCollectionsService,
  getDealerEarningsService,
} from "./dealerDashboard.services.js";
import {
  getCustomerLoansService,
  getCustomerEmisService,
  getCustomerPaymentHistoryService,
} from "./customerDashboard.services.js";
import { ROLES } from "../../utils/constants.js";

// Admin Dashboard Controllers
export async function getAdminOverviewController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_ACCESS");
    }
    const result = await getAdminOverviewService(db, session);
    return res.success(result, "ADMIN_OVERVIEW");
  } catch (err) {
    next(err);
  }
}

export async function getAdminDisbursementController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_ACCESS");
    }
    const result = await getAdminDisbursementService(db, session);
    return res.success(result, "ADMIN_DISBURSEMENT");
  } catch (err) {
    next(err);
  }
}

export async function getAdminCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_ACCESS");
    }
    const result = await getAdminCollectionsService(db, session);
    return res.success(result, "ADMIN_COLLECTIONS");
  } catch (err) {
    next(err);
  }
}

export async function getAdminNpaController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_ACCESS");
    }
    const result = await getAdminNpaService(db, session);
    return res.success(result, "ADMIN_NPA");
  } catch (err) {
    next(err);
  }
}

// Lender Dashboard Controllers
export async function getLenderPortfolioController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_ACCESS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await getLenderPortfolioService(
      db,
      session,
      req.user.lenderId,
    );
    return res.success(result, "LENDER_PORTFOLIO");
  } catch (err) {
    next(err);
  }
}

export async function getLenderDisbursementController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_ACCESS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await getLenderDisbursementService(
      db,
      session,
      req.user.lenderId,
    );
    return res.success(result, "LENDER_DISBURSEMENT");
  } catch (err) {
    next(err);
  }
}

export async function getLenderOutstandingController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_ACCESS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await getLenderOutstandingService(
      db,
      session,
      req.user.lenderId,
    );
    return res.success(result, "LENDER_OUTSTANDING");
  } catch (err) {
    next(err);
  }
}

export async function getLenderNpaController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_ACCESS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await getLenderNpaService(db, session, req.user.lenderId);
    return res.success(result, "LENDER_NPA");
  } catch (err) {
    next(err);
  }
}

export async function getLenderPendingCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_ACCESS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await getLenderPendingCollectionsService(
      db,
      session,
      req.user.lenderId,
    );
    return res.success(result, "LENDER_PENDING_COLLECTIONS");
  } catch (err) {
    next(err);
  }
}

// Dealer Dashboard Controllers
export async function getDealerSalesFunnelController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_ACCESS");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING");
    }
    const result = await getDealerSalesFunnelService(
      db,
      session,
      req.user.dealerId,
    );
    return res.success(result, "DEALER_SALES_FUNNEL");
  } catch (err) {
    next(err);
  }
}

export async function getDealerCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_ACCESS");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING");
    }
    const result = await getDealerCollectionsService(
      db,
      session,
      req.user.dealerId,
    );
    return res.success(result, "DEALER_COLLECTIONS");
  } catch (err) {
    next(err);
  }
}

export async function getDealerEarningsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_ACCESS");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING");
    }
    const result = await getDealerEarningsService(
      db,
      session,
      req.user.dealerId,
    );
    return res.success(result, "DEALER_EARNINGS");
  } catch (err) {
    next(err);
  }
}

// Customer Dashboard Controllers
export async function getCustomerLoansController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    // For now, customerId should be passed as query param or from user context
    // In a real system, you might have a CUSTOMER role or link customer to user
    const customerId = req.query.customerId || req.user.customerId;
    if (!customerId) {
      return res.fail(400, "CUSTOMER_ID_REQUIRED");
    }

    const result = await getCustomerLoansService(db, session, customerId);
    return res.success(result, "CUSTOMER_LOANS");
  } catch (err) {
    next(err);
  }
}

export async function getCustomerEmisController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    const customerId = req.query.customerId || req.user.customerId;
    if (!customerId) {
      return res.fail(400, "CUSTOMER_ID_REQUIRED");
    }

    const result = await getCustomerEmisService(db, session, customerId);
    return res.success(result, "CUSTOMER_EMIS");
  } catch (err) {
    next(err);
  }
}

export async function getCustomerPaymentHistoryController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    const customerId = req.query.customerId || req.user.customerId;
    if (!customerId) {
      return res.fail(400, "CUSTOMER_ID_REQUIRED");
    }

    const result = await getCustomerPaymentHistoryService(
      db,
      session,
      customerId,
    );
    return res.success(result, "CUSTOMER_PAYMENT_HISTORY");
  } catch (err) {
    next(err);
  }
}
