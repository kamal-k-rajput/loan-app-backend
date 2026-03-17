import {
  loginService,
  logoutService,
  refreshTokenService,
  changePasswordService,
  forgotPasswordService,
  resetPasswordService,
  getProfileService,
  updateProfileService,
} from "./auth.services.js";

export async function loginController(req, res, next) {
  try {
    const session = req.mongoSession;
    const db = req.app.locals.db;
    const result = await loginService(db, session, req.body);
    return res.success(result, "LOGIN_SUCCESS");
  } catch (err) {
    if (err.message === "INVALID_CREDENTIALS") {
      return res.fail(401, "UNAUTHORIZED", "Invalid email or password");
    }
    next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    const result = await logoutService();
    return res.success(result, "LOGOUT_SUCCESS");
  } catch (err) {
    next(err);
  }
}

export async function refreshTokenController(req, res, next) {
  try {
    const result = await refreshTokenService();
    return res.success(result, "REFRESH_SUCCESS");
  } catch (err) {
    next(err);
  }
}

export async function changePasswordController(req, res, next) {
  try {
    const session = req.mongoSession;
    const db = req.app.locals.db;
    const userId = req.headers["x-user-id"];
    const result = await changePasswordService(db, session, userId, req.body);
    if (!result) {
      return res.fail(400, "CHANGE_PASSWORD_FAILED");
    }
    return res.success(null, "CHANGE_PASSWORD_SUCCESS");
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordController(req, res, next) {
  try {
    const session = req.mongoSession;
    const db = req.app.locals.db;
    const result = await forgotPasswordService(db, session, req.body);
    return res.success(result, "FORGOT_PASSWORD_EMAIL_SENT");
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    const session = req.mongoSession;
    const db = req.app.locals.db;
    const ok = await resetPasswordService(db, session, req.body);
    if (!ok) {
      return res.fail(400, "RESET_PASSWORD_FAILED");
    }
    return res.success(null, "RESET_PASSWORD_SUCCESS");
  } catch (err) {
    next(err);
  }
}

export async function profileController(req, res, next) {
  try {
    const session = req.mongoSession;
    const db = req.app.locals.db;
    const userId = req.headers["x-user-id"];
    const profile = await getProfileService(db, session, userId);
    if (!profile) {
      return res.fail(404, "USER_NOT_FOUND");
    }
    return res.success(profile, "PROFILE_FETCH_SUCCESS");
  } catch (err) {
    next(err);
  }
}

export async function updateProfileController(req, res, next) {
  try {
    const session = req.mongoSession;
    const db = req.app.locals.db;
    const userId = req.headers["x-user-id"];
    const updated = await updateProfileService(db, session, userId, req.body);
    if (!updated) {
      return res.fail(404, "USER_NOT_FOUND");
    }
    return res.success(updated, "PROFILE_UPDATE_SUCCESS");
  } catch (err) {
    next(err);
  }
}
