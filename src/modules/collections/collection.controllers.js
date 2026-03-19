import {
  recordCollectionService,
  listCollectionsService,
  getCollectionService,
  approveCollectionService,
  rejectCollectionService,
  getPendingCollectionsService
} from "./collection.services.js";
import { ROLES } from "../../utils/constants.js";

export async function recordCollectionController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.DEALER) {
      return res.fail(403, "ONLY_DEALER_CAN_RECORD_COLLECTION");
    }
    if (!req.user.dealerId) {
      return res.fail(400, "DEALER_ID_MISSING");
    }
    const result = await recordCollectionService(db, session, req.body, req.user.dealerId);
    return res.success(result, "COLLECTION_RECORDED");
  } catch (err) {
    if (
      err.message === "LOAN_NOT_FOUND_OR_NOT_ACCESSIBLE" ||
      err.message === "EMI_NOT_FOUND_OR_MISMATCH" ||
      err.message === "LOAN_CONTRACT_NOT_FOUND"
    ) {
      return res.fail(404, err.message);
    }
    if (
      err.message === "EMI_ALREADY_PAID" ||
      err.message === "COLLECTION_ALREADY_SUBMITTED_FOR_EMI"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function listCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const collections = await listCollectionsService(db, session, req.user);
    return res.success(collections, "COLLECTIONS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getCollectionController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const collection = await getCollectionService(db, session, req.params.collectionId);
    if (!collection) return res.fail(404, "COLLECTION_NOT_FOUND");
    return res.success(collection, "COLLECTION_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function approveCollectionController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_APPROVE_COLLECTION");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await approveCollectionService(
      db,
      session,
      req.params.collectionId,
      req.user.lenderId,
      req.body.remarks
    );
    return res.success(result, "COLLECTION_APPROVED");
  } catch (err) {
    if (err.message === "COLLECTION_NOT_FOUND") {
      return res.fail(404, "COLLECTION_NOT_FOUND");
    }
    if (
      err.message === "COLLECTION_NOT_PENDING_APPROVAL" ||
      err.message === "CANNOT_APPROVE_OTHER_LENDER_COLLECTION"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function rejectCollectionController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_REJECT_COLLECTION");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const result = await rejectCollectionService(
      db,
      session,
      req.params.collectionId,
      req.user.lenderId,
      req.body.reason
    );
    return res.success(result, "COLLECTION_REJECTED");
  } catch (err) {
    if (err.message === "COLLECTION_NOT_FOUND") {
      return res.fail(404, "COLLECTION_NOT_FOUND");
    }
    if (
      err.message === "COLLECTION_NOT_PENDING_APPROVAL" ||
      err.message === "CANNOT_REJECT_OTHER_LENDER_COLLECTION"
    ) {
      return res.fail(400, err.message);
    }
    next(err);
  }
}

export async function getPendingCollectionsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.LENDER) {
      return res.fail(403, "ONLY_LENDER_CAN_VIEW_PENDING_COLLECTIONS");
    }
    if (!req.user.lenderId) {
      return res.fail(400, "LENDER_ID_MISSING");
    }
    const collections = await getPendingCollectionsService(db, session, req.user.lenderId);
    return res.success(collections, "PENDING_COLLECTIONS");
  } catch (err) {
    next(err);
  }
}
