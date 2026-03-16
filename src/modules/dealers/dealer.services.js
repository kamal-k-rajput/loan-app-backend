import {
  createDealer,
  listDealers,
  getDealerById,
  updateDealer,
  deleteDealer,
  getDealerLoans,
  getDealerCollections,
  getDealerEarnings
} from "./dealer.repositories.js";
import { createUser } from "../adminUsers/adminUser.repositories.js";
import { ROLES } from "../../utils/constants.js";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

export async function createDealerService(db, session, payload) {
  const { email, ownerName, phone, ...dealerData } = payload;

  // Check if user with this email already exists
  const existingUser = await db.collection("users").findOne({ email }, { session });
  if (existingUser) {
    throw new Error("USER_WITH_EMAIL_EXISTS");
  }

  // Create dealer record first
  const dealer = await createDealer(db, session, dealerData);
  const dealerId = dealer._id;

  // Create user record with email as initial password
  const initialPassword = email; // First time password = email
  const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);

  const userDoc = {
    name: ownerName,
    email,
    phone,
    passwordHash,
    role: ROLES.DEALER,
    dealerId: dealerId, // Link user to dealer
    status: "ACTIVE"
  };

  const user = await createUser(db, session, userDoc);

  return {
    ...dealer,
    id: dealer._id.toString(),
    userId: user._id.toString()
  };
}

export async function listDealersService(db, session) {
  const dealers = await listDealers(db, session);
  return dealers.map((d) => ({ ...d, id: d._id.toString() }));
}

export async function getDealerService(db, session, dealerId) {
  const dealer = await getDealerById(db, session, dealerId);
  if (!dealer) return null;
  return { ...dealer, id: dealer._id.toString() };
}

export async function updateDealerService(db, session, dealerId, updates) {
  const dealer = await updateDealer(db, session, dealerId, updates);
  if (!dealer) return null;
  return { ...dealer, id: dealer._id.toString() };
}

export async function deleteDealerService(db, session, dealerId) {
  return deleteDealer(db, session, dealerId);
}

export async function dealerLoansService(db, session, dealerId) {
  return getDealerLoans(db, session, dealerId);
}

export async function dealerCollectionsService(db, session, dealerId) {
  return getDealerCollections(db, session, dealerId);
}

export async function dealerEarningsService(db, session, dealerId) {
  return getDealerEarnings(db, session, dealerId);
}

