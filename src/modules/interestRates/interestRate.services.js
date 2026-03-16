import {
  createInterestRate,
  listInterestRates,
  getInterestRateById,
  getInterestRatesByLender,
  updateInterestRate,
  deleteInterestRate
} from "./interestRate.repositories.js";
import { ObjectId } from "mongodb";

export async function createInterestRateService(db, session, payload, lenderId) {
  const doc = {
    ...payload,
    lenderId: new ObjectId(lenderId)
  };
  const rate = await createInterestRate(db, session, doc);
  return { ...rate, id: rate._id.toString() };
}

export async function listInterestRatesService(db, session) {
  const rates = await listInterestRates(db, session);
  return rates.map((r) => ({
    ...r,
    id: r._id.toString(),
    lenderId: r.lenderId ? r.lenderId.toString() : null
  }));
}

export async function getInterestRateService(db, session, rateId) {
  const rate = await getInterestRateById(db, session, rateId);
  if (!rate) return null;
  return {
    ...rate,
    id: rate._id.toString(),
    lenderId: rate.lenderId ? rate.lenderId.toString() : null
  };
}

export async function getInterestRatesByLenderService(db, session, lenderId) {
  const rates = await getInterestRatesByLender(db, session, lenderId);
  return rates.map((r) => ({
    ...r,
    id: r._id.toString(),
    lenderId: r.lenderId ? r.lenderId.toString() : null
  }));
}

export async function updateInterestRateService(db, session, rateId, updates) {
  const rate = await updateInterestRate(db, session, rateId, updates);
  if (!rate) return null;
  return {
    ...rate,
    id: rate._id.toString(),
    lenderId: rate.lenderId ? rate.lenderId.toString() : null
  };
}

export async function deleteInterestRateService(db, session, rateId) {
  return deleteInterestRate(db, session, rateId);
}
