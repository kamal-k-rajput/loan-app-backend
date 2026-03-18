import {
  createCustomerService,
  listCustomersService,
  listDealerCustomersService,
  getCustomerService,
  updateCustomerService,
  deleteCustomerService,
  customerLoansService,
  customerEmisService,
  customerPaymentsService
} from "./customer.services.js";
import { ROLES } from "../../utils/constants.js";

export async function createCustomerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_CREATE_CUSTOMER");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING", "Dealer user is not linked to a dealer");
    }
    const customer = await createCustomerService(db, session, req.user.dealerId, req.body);
    return res.success(customer, "CUSTOMER_CREATED");
  } catch (err) {
    next(err);
  }
}

export async function listCustomersController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const customers = await listCustomersService(db, session);
    return res.success(customers, "CUSTOMERS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function listDealerCustomersController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;

    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_LIST_OWN_CUSTOMERS");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING", "Dealer user is not linked to a dealer");
    }

    const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit = parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 20;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const result = await listDealerCustomersService(db, session, req.user.dealerId, {
      page,
      limit,
      startDate,
      endDate
    });

    return res.success(result, "DEALER_CUSTOMERS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getCustomerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const customer = await getCustomerService(db, session, req.params.customerId);
    if (!customer) return res.fail(404, "CUSTOMER_NOT_FOUND");
    return res.success(customer, "CUSTOMER_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    // If dealer, ensure they can only update customers they created
    if (req.user.role === ROLES.DEALER) {
      if (!req.user.dealerId) {
        return res.fail(400, "DEALER_ID_MISSING", "Dealer user is not linked to a dealer");
      }
      const existing = await getCustomerService(db, session, req.params.customerId);
      if (!existing) {
        return res.fail(404, "CUSTOMER_NOT_FOUND");
      }
      if (!existing.createdByDealer || existing.createdByDealer.toString() !== req.user.dealerId) {
        return res.fail(403, "CANNOT_UPDATE_OTHER_DEALER_CUSTOMER");
      }
    }

    const customer = await updateCustomerService(db, session, req.params.customerId, req.body);
    if (!customer) return res.fail(404, "CUSTOMER_NOT_FOUND");
    return res.success(customer, "CUSTOMER_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const ok = await deleteCustomerService(db, session, req.params.customerId);
    if (!ok) return res.fail(404, "CUSTOMER_NOT_FOUND");
    return res.success(null, "CUSTOMER_DELETED");
  } catch (err) {
    next(err);
  }
}

export async function customerLoansController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const loans = await customerLoansService(db, session, req.params.customerId);
    return res.success(loans, "CUSTOMER_LOANS");
  } catch (err) {
    next(err);
  }
}

export async function customerEmisController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const emis = await customerEmisService(db, session, req.params.customerId);
    return res.success(emis, "CUSTOMER_EMIS");
  } catch (err) {
    next(err);
  }
}

export async function customerPaymentsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const payments = await customerPaymentsService(db, session, req.params.customerId);
    return res.success(payments, "CUSTOMER_PAYMENTS");
  } catch (err) {
    next(err);
  }
}

