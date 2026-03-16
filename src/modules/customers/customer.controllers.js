import {
  createCustomerService,
  listCustomersService,
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

