import {
  createUserService,
  listUsersService,
  getUserService,
  updateUserService,
  deleteUserService,
  activateUserService,
  deactivateUserService,
  listRolesService,
} from "./adminUser.services.js";

export async function createUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const created = await createUserService(db, session, req.body);
    return res.success(created, "USER_CREATED");
  } catch (err) {
    next(err);
  }
}

export async function listUsersController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const {
      role,
      fromDate,
      toDate,
      search,
      limit: rawLimit,
      offset: rawOffset,
    } = req.query;

    const limit = Number.parseInt(rawLimit ?? "20", 10);
    const offset = Number.parseInt(rawOffset ?? "0", 10);

    const result = await listUsersService(db, session, {
      role,
      fromDate,
      toDate,
      search,
      limit,
      offset,
    });

    return res.success(result, "USERS_LIST");
  } catch (err) {
    next(err);
  }
}

export async function getUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const user = await getUserService(db, session, req.params.userId);
    if (!user) return res.fail(404, "USER_NOT_FOUND");
    return res.success(user, "USER_FETCHED");
  } catch (err) {
    next(err);
  }
}

export async function updateUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const user = await updateUserService(
      db,
      session,
      req.params.userId,
      req.body,
    );
    if (!user) return res.fail(404, "USER_NOT_FOUND");
    return res.success(user, "USER_UPDATED");
  } catch (err) {
    next(err);
  }
}

export async function deleteUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const ok = await deleteUserService(db, session, req.params.userId);
    if (!ok) return res.fail(404, "USER_NOT_FOUND");
    return res.success(null, "USER_DELETED");
  } catch (err) {
    next(err);
  }
}

export async function activateUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    const user = await activateUserService(db, session, req.params.userId);
    if (!user) return res.fail(404, "USER_NOT_FOUND");
    return res.success(user, "USER_ACTIVATED");
  } catch (err) {
    next(err);
  }
}

export async function deactivateUserController(req, res, next) {
  try {
    const db = req.app.locals.db;
    const session = req.mongoSession;
    if (req.params.userId === req.user.id)
      return res.fail(400, "CANNOT_DEACTIVATE_SELF");
    const user = await deactivateUserService(db, session, req.params.userId);
    if (!user) return res.fail(404, "USER_NOT_FOUND");
    return res.success(user, "USER_DEACTIVATED");
  } catch (err) {
    next(err);
  }
}

export async function listRolesController(req, res, next) {
  try {
    const roles = listRolesService();
    return res.success(roles, "ROLES_LIST");
  } catch (err) {
    next(err);
  }
}
