import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  setUserStatus,
  listRoles,
} from "./adminUser.repositories.js";

const BCRYPT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function createUserService(db, session, payload) {
  const { password, ...rest } = payload;
  const passwordHash = await hashPassword(password);
  const doc = await createUser(db, session, { ...rest, passwordHash });
  const { passwordHash: _, ...safe } = doc;
  return safe;
}

export async function listUsersService(
  db,
  session,
  { role, fromDate, toDate, limit, offset },
) {
  const { total, docs } = await listUsers(db, session, {
    role,
    fromDate,
    toDate,
    limit,
    offset,
  });

  const items = docs.map((u) => {
    const { passwordHash, ...rest } = u;
    return { ...rest, id: u._id.toString() };
  });

  return { total, items, limit, offset };
}

export async function getUserService(db, session, userId) {
  const user = await getUserById(db, session, userId);
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return { ...rest, id: user._id.toString() };
}

export async function updateUserService(db, session, userId, updates) {
  const updated = await updateUser(db, session, userId, updates);
  if (!updated) return null;
  const { passwordHash, ...rest } = updated;
  return { ...rest, id: updated._id.toString() };
}

export async function deleteUserService(db, session, userId) {
  return deleteUser(db, session, userId);
}

export async function activateUserService(db, session, userId) {
  const updated = await setUserStatus(db, session, userId, "ACTIVE");
  if (!updated) return null;
  const { passwordHash, ...rest } = updated;
  return { ...rest, id: updated._id.toString() };
}

export async function deactivateUserService(db, session, userId) {
  const updated = await setUserStatus(db, session, userId, "INACTIVE");
  if (!updated) return null;
  const { passwordHash, ...rest } = updated;
  return { ...rest, id: updated._id.toString() };
}

export function listRolesService() {
  return listRoles();
}

