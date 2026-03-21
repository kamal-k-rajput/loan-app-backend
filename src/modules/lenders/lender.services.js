import { ObjectId } from "mongodb";
import {
  createLender,
  listLenders,
  getLenderById,
  updateLender,
  deleteLender,
  lenderPortfolio,
  lenderCollections,
} from "./lender.repositories.js";
import {
  createUser,
  updateUser,
  usersCollection,
} from "../adminUsers/adminUser.repositories.js";
import { ROLES } from "../../utils/constants.js";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

export async function createLenderService(db, session, payload) {
  const { email, contactPerson, phone, ...lenderData } = payload;

  // Check if user with this email already exists
  const existingUser = await db
    .collection("users")
    .findOne({ email }, { session });
  if (existingUser) {
    throw new Error("USER_WITH_EMAIL_EXISTS");
  }

  // Create lender record first
  const lender = await createLender(db, session, {
    ...lenderData,
    email,
    name: payload.lenderName,
    contactPerson,
    phone,
  });
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
    status: "ACTIVE",
  };

  const user = await createUser(db, session, userDoc);

  return {
    ...lender,
    id: lender._id.toString(),
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
    userId: user._id.toString(),
  };
}

export async function listLendersService(db, session, { search } = {}) {
  const lenders = await listLenders(db, session, { search });
  return lenders.map((l) => ({ ...l, id: l._id.toString() }));
}

export async function getLenderService(db, session, lenderId) {
  const lender = await getLenderById(db, session, lenderId);
  if (!lender) return null;
  return { ...lender, id: lender._id.toString() };
}

export async function updateLenderService(db, session, lenderId, updates) {
  const { contactPerson, email, phone, ...lenderOnlyUpdates } = updates;

  // If email is being updated, ensure no other user has it (excluding this lender's user)
  if (email) {
    const existingUser = await usersCollection(db).findOne(
      { email, lenderId: { $ne: new ObjectId(lenderId) } },
      { session },
    );
    if (existingUser) {
      throw new Error("USER_WITH_EMAIL_EXISTS");
    }
  }

  const lender = await updateLender(db, session, lenderId, updates);
  if (!lender) return null;

  // Sync overlapping fields to user collection (name, email, phone)
  const linkedUser = await usersCollection(db).findOne(
    { lenderId: new ObjectId(lenderId) },
    { session },
  );
  if (linkedUser) {
    const userUpdates = {};
    if (contactPerson !== undefined) userUpdates.name = contactPerson;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (Object.keys(userUpdates).length > 0) {
      await updateUser(db, session, linkedUser._id.toString(), userUpdates);
    }
  }

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
