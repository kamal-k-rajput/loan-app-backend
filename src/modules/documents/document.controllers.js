import {
  uploadDocumentService,
  getDocumentService,
  deleteDocumentService,
  listDocumentsService
} from "./document.services.js";
import { ROLES } from "../../utils/constants.js";

export async function uploadDocumentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const result = await uploadDocumentService(db, session, req.body);
    return res.success(result, "DOCUMENT_UPLOADED");
  } catch (err) {
    next(err);
  }
}

export async function getDocumentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const document = await getDocumentService(db, session, req.params.documentId);
    if (!document) return res.fail(404, "DOCUMENT_NOT_FOUND");
    return res.success(document, "DOCUMENT_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function deleteDocumentController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const ok = await deleteDocumentService(db, session, req.params.documentId, req.user);
    if (!ok) return res.fail(404, "DOCUMENT_NOT_FOUND");
    return res.success(null, "DOCUMENT_DELETED");
  } catch (err) {
    if (err.message === "DOCUMENT_NOT_ACCESSIBLE") {
      return res.fail(403, "DOCUMENT_NOT_ACCESSIBLE");
    }
    next(err);
  }
}
