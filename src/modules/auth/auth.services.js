import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  findUserByEmail,
  findUserById,
  updateUserPassword,
  updateUserProfile,
} from "./auth.repositories.js";
import { signAuthToken } from "../../utils/jwt.js";

const BCRYPT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function verifyPassword(plain, hashed) {
  const result = await bcrypt.compare(plain, hashed);
  return result;
}

export async function loginService(db, session, { email, password }) {
  const user = await findUserByEmail(db, session, email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const result = await verifyPassword(password, user.passwordHash);
  if (!result) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
    dealerId: user.dealerId ? user.dealerId.toString() : null,
    lenderId: user.lenderId ? user.lenderId.toString() : null,
  };
  const token = signAuthToken(tokenPayload);

  return {
    ...tokenPayload,
    token,
  };
}

export async function logoutService() {
  return { loggedOut: true };
}

export async function refreshTokenService() {
  return { refreshed: true };
}

export async function changePasswordService(
  db,
  session,
  userId,
  { oldPassword, newPassword, newPasswordConfirm },
) {
  if (!userId) return false;
  const user = await findUserById(db, session, userId);
  if (!user) return false;
  const ok = await verifyPassword(oldPassword, user.passwordHash);
  if (!ok) {
    return false;
  }
  if (newPasswordConfirm && newPasswordConfirm !== newPassword) {
    return false;
  }
  const newHash = await hashPassword(newPassword);
  return updateUserPassword(db, session, userId, newHash);
}

export async function forgotPasswordService(db, session, { email }) {
  const user = await findUserByEmail(db, session, email);
  if (!user) {
    return { sent: false };
  }
  // In production, store token in a collection and send via email/SMS.
  const token = crypto.randomBytes(16).toString("hex");
  return { sent: true, token };
}

export async function resetPasswordService(
  db,
  session,
  { token, newPassword },
) {
  if (!token) return false;
  // In production, lookup token → user. Here we just simulate failure/success.
  const dummyUser = await db.collection("users").findOne({}, { session });
  if (!dummyUser) return false;
  const newHash = await hashPassword(newPassword);
  return updateUserPassword(db, session, dummyUser._id.toString(), newHash);
}

export async function getProfileService(db, session, userId) {
  if (!userId) return null;
  const user = await findUserById(db, session, userId);
  if (!user) return null;
  // Do not expose passwordHash
  const { passwordHash, ...rest } = user;
  return { ...rest, id: user._id.toString() };
}

export async function updateProfileService(db, session, userId, updates) {
  if (!userId) return null;
  const updated = await updateUserProfile(db, session, userId, updates);
  if (!updated) return null;
  const { passwordHash, ...rest } = updated;
  return { ...rest, id: updated._id.toString() };
}
