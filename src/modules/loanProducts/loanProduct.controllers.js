import {
  createLoanProductService,
  listLoanProductsService,
  getLoanProductService,
  updateLoanProductService,
  deleteLoanProductService
} from "./loanProduct.services.js";
import { ROLES } from "../../utils/constants.js";

export async function createLoanProductController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_CREATE_PRODUCT");
    }
    const product = await createLoanProductService(db, session, req.body);
    return res.success(product, "LOAN_PRODUCT_CREATED");
  } catch (err) {
    next(err);
  }
}

export async function listLoanProductsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const products = await listLoanProductsService(db, session);
    return res.success(products, "LOAN_PRODUCTS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getLoanProductController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const product = await getLoanProductService(db, session, req.params.productId);
    if (!product) return res.fail(404, "LOAN_PRODUCT_NOT_FOUND");
    return res.success(product, "LOAN_PRODUCT_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateLoanProductController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_UPDATE_PRODUCT");
    }
    const product = await updateLoanProductService(db, session, req.params.productId, req.body);
    if (!product) return res.fail(404, "LOAN_PRODUCT_NOT_FOUND");
    return res.success(product, "LOAN_PRODUCT_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteLoanProductController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_DELETE_PRODUCT");
    }
    const ok = await deleteLoanProductService(db, session, req.params.productId);
    if (!ok) return res.fail(404, "LOAN_PRODUCT_NOT_FOUND");
    return res.success(null, "LOAN_PRODUCT_DELETED");
  } catch (err) {
    next(err);
  }
}
