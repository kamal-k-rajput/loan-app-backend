import {
  createConfigService,
  listConfigsService,
  getConfigService,
  updateConfigService,
  deleteConfigService
} from "./config.services.js";
import { ROLES } from "../../utils/constants.js";

export async function createConfigController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_CREATE_CONFIG");
    }
    const config = await createConfigService(db, session, req.body);
    return res.success(config, "CONFIG_CREATED");
  } catch (err) {
    if (err.message === "CONFIG_KEY_ALREADY_EXISTS") {
      return res.fail(400, "CONFIG_KEY_ALREADY_EXISTS");
    }
    next(err);
  }
}

export async function listConfigsController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const configs = await listConfigsService(db, session);
    return res.success(configs, "CONFIGS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getConfigController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user) return res.fail(401, "AUTH_REQUIRED");
    const config = await getConfigService(db, session, req.params.configId);
    if (!config) return res.fail(404, "CONFIG_NOT_FOUND");
    return res.success(config, "CONFIG_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateConfigController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_UPDATE_CONFIG");
    }
    const config = await updateConfigService(db, session, req.params.configId, req.body);
    if (!config) return res.fail(404, "CONFIG_NOT_FOUND");
    return res.success(config, "CONFIG_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteConfigController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (!req.user || req.user.role !== ROLES.ADMIN) {
      return res.fail(403, "ONLY_ADMIN_CAN_DELETE_CONFIG");
    }
    const ok = await deleteConfigService(db, session, req.params.configId);
    if (!ok) return res.fail(404, "CONFIG_NOT_FOUND");
    return res.success(null, "CONFIG_DELETED");
  } catch (err) {
    next(err);
  }
}
