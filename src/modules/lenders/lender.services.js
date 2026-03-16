import {
  createLender,
  listLenders,
  getLenderById,
  updateLender,
  deleteLender,
  lenderPortfolio,
  lenderCollections
} from "./lender.repositories.js";
import { createUser } from "../adminUsers/adminUser.repositories.js";
import { ROLES } from "../../utils/constants.js";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

export async function createLenderService(db, session, payload) {
  const { email, contactPerson, phone, ...lenderData } = payload;

  // Check if user with this email already exists
  const existingUser = await db.collection("users").findOne({ email }, { session });
  if (existingUser) {
    throw new Error("USER_WITH_EMAIL_EXISTS");
  }

  // Create lender record first
  const lender = await createLender(db, session, lenderData);
  const lenderId = lender._id;

  // Create user record with email as initial password
  const initialPassword = email; // First time password = email
  const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);

  const userDoc = {
    name: contactPerson,
    email,
    phone,
    passwordHash,
    role: ROLES.LENDER,
    lenderId: lenderId, // Link user to lender
    status: "ACTIVE"
  };

  const user = await createUser(db, session, userDoc);

  return {
    ...lender,
    id: lender._id.toString(),
    userId: user._id.toString()
  };
}

export async function listLendersService(db, session) {
  const lenders = await listLenders(db, session);
  return lenders.map((l) => ({ ...l, id: l._id.toString() }));
}

export async function getLenderService(db, session, lenderId) {
  const lender = await getLenderById(db, session, lenderId);
  if (!lender) return null;
  return { ...lender, id: lender._id.toString() };
}

export async function updateLenderService(db, session, lenderId, updates) {
  const lender = await updateLender(db, session, lenderId, updates);
  if (!lender) return null;
  return { ...lender, id: lender._id.toString() };
}

export async function deleteLenderService(db, session, lenderId) {
  return deleteLender(db, session, lenderId);
}

export async function lenderPortfolioService(db, session, lenderId) {
  return lenderPortfolio(db, session, lenderId);
}

export async function lenderCollectionsService(db, session, lenderId) {
  return lenderCollections(db, session, lenderId);
}

