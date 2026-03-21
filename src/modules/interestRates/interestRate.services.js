import {
  createInterestRate,
  listInterestRates,
  getInterestRateById,
  getInterestRatesByLender,
  updateInterestRate,
  deleteInterestRate
} from "./interestRate.repositories.js";
import { LOAN_PRODUCT_CATEGORIES } from "../../utils/constants.js";
import { normalizeInterestRateType } from "../../utils/emiCalculator.js";
import { ObjectId } from "mongodb";

/** Public shape for by-category list: EMI preview only needs rateId → interest + file charge % */
function serializeRateForByCategory(r) {
  return {
    id: r._id.toString(),
    productCategory: r.productCategory,
    interestRate: r.interestRate,
    processingFee: r.processingFee,
    rateType: normalizeInterestRateType(r.rateType),
    createdAt: r.createdAt ?? null
  };
}

export async function createInterestRateService(db, session, payload, lenderId) {
  const doc = {
    ...payload,
    lenderId: new ObjectId(lenderId),
    rateType: normalizeInterestRateType(payload.rateType)
  };
  const rate = await createInterestRate(db, session, doc);
  return {
    ...rate,
    id: rate._id.toString(),
    rateType: normalizeInterestRateType(rate.rateType)
  };
}

export async function listInterestRatesService(db, session) {
  const rates = await listInterestRates(db, session);
  return rates.map((r) => ({
    ...r,
    id: r._id.toString(),
    lenderId: r.lenderId ? r.lenderId.toString() : null,
    rateType: normalizeInterestRateType(r.rateType)
  }));
}

/**
 * All interest rates grouped by product category (read-only; for dealer apply / comparison).
 */
export async function listInterestRatesByCategoryService(db, session) {
  const rates = await listInterestRates(db, session);
  const byCategory = {};
  for (const cat of LOAN_PRODUCT_CATEGORIES) {
    byCategory[cat] = [];
  }
  for (const r of rates) {
    const cat = r.productCategory;
    const row = serializeRateForByCategory(r);
    if (byCategory[cat]) {
      byCategory[cat].push(row);
    } else {
      byCategory[cat] = [row];
    }
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => {
      const ir = Number(a.interestRate) - Number(b.interestRate);
      if (ir !== 0) return ir;
      return a.id.localeCompare(b.id);
    });
  }
  return {
    byCategory,
    categories: LOAN_PRODUCT_CATEGORIES.map((category) => ({
      category,
      rates: byCategory[category] || [],
      count: (byCategory[category] || []).length
    }))
  };
}

export async function getInterestRateService(db, session, rateId) {
  const rate = await getInterestRateById(db, session, rateId);
  if (!rate) return null;
  return {
    ...rate,
    id: rate._id.toString(),
    lenderId: rate.lenderId ? rate.lenderId.toString() : null,
    rateType: normalizeInterestRateType(rate.rateType)
  };
}

export async function getInterestRatesByLenderService(db, session, lenderId) {
  const rates = await getInterestRatesByLender(db, session, lenderId);
  return rates.map((r) => ({
    ...r,
    id: r._id.toString(),
    lenderId: r.lenderId ? r.lenderId.toString() : null,
    rateType: normalizeInterestRateType(r.rateType)
  }));
}

export async function updateInterestRateService(db, session, rateId, updates) {
  const patch = { ...updates };
  if (patch.rateType != null) {
    patch.rateType = normalizeInterestRateType(patch.rateType);
  }
  const rate = await updateInterestRate(db, session, rateId, patch);
  if (!rate) return null;
  return {
    ...rate,
    id: rate._id.toString(),
    lenderId: rate.lenderId ? rate.lenderId.toString() : null,
    rateType: normalizeInterestRateType(rate.rateType)
  };
}

export async function deleteInterestRateService(db, session, rateId) {
  return deleteInterestRate(db, session, rateId);
}
