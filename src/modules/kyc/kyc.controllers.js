import {
  uploadKycService,
  getKycByCustomerService,
  verifyKycService,
  rejectKycService,
  panVerifyService,
  aadharVerifyService
} from "./kyc.services.js";
import { ROLES } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function uploadKycController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || (req.user.role !== ROLES.DEALER && req.user.role !== ROLES.ADMIN)) {
      return res.fail(403, "ONLY_DEALER_OR_ADMIN_CAN_UPLOAD_KYC");
    }
    const result = await uploadKycService(db, session, req.body);
    return res.success(result, "KYC_UPLOADED");
  } catch (err) {
    if (err.message === "CUSTOMER_NOT_FOUND") {
      return res.fail(404, "CUSTOMER_NOT_FOUND");
    }
    next(err);
  }
}

export async function getKycByCustomerController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");

    // Dealers can only see their own customers
    const customerId = req.params.customerId;
    if (req.user.role === ROLES.DEALER) {
      // Verify customer belongs to this dealer
      const customer = await db
        .collection("customers")
        .findOne({ _id: new ObjectId(customerId), createdByDealer: new ObjectId(req.user.dealerId) }, { session });
      if (!customer) {
        return res.fail(403, "CUSTOMER_NOT_ACCESSIBLE");
      }
    }

    const result = await getKycByCustomerService(db, session, customerId);
    if (!result) return res.fail(404, "CUSTOMER_NOT_FOUND");
    return res.success(result, "KYC_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function verifyKycController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.LENDER)) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_VERIFY_KYC");
    }
    const result = await verifyKycService(db, session, req.params.customerId, req.body.remarks);
    return res.success(result, "KYC_VERIFIED");
  } catch (err) {
    if (err.message === "CUSTOMER_NOT_FOUND") {
      return res.fail(404, "CUSTOMER_NOT_FOUND");
    }
    next(err);
  }
}

export async function rejectKycController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.LENDER)) {
      return res.fail(403, "ONLY_ADMIN_OR_LENDER_CAN_REJECT_KYC");
    }
    const result = await rejectKycService(db, session, req.params.customerId, req.body.reason);
    return res.success(result, "KYC_REJECTED");
  } catch (err) {
    if (err.message === "CUSTOMER_NOT_FOUND") {
      return res.fail(404, "CUSTOMER_NOT_FOUND");
    }
    next(err);
  }
}

export async function panVerifyController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await panVerifyService(db, session, req.body.customerId, req.body.panNumber);
    return res.success(result, "PAN_VERIFIED");
  } catch (err) {
    if (err.message === "CUSTOMER_NOT_FOUND") {
      return res.fail(404, "CUSTOMER_NOT_FOUND");
    }
    next(err);
  }
}

export async function aadharVerifyController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await aadharVerifyService(db, session, req.body.customerId, req.body.aadharNumber);
    return res.success(result, "AADHAR_VERIFIED");
  } catch (err) {
    if (err.message === "CUSTOMER_NOT_FOUND") {
      return res.fail(404, "CUSTOMER_NOT_FOUND");
    }
    next(err);
  }
}
