import Joi from "joi";
import { LOAN_PRODUCT_CATEGORIES, INTEREST_RATE_TYPES } from "../../utils/constants.js";

const RATE_TYPE_VALUES = [INTEREST_RATE_TYPES.FLAT, INTEREST_RATE_TYPES.REDUCING];

export const createInterestRateSchema = Joi.object({
  lenderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  productCategory: Joi.string()
    .valid(...LOAN_PRODUCT_CATEGORIES)
    .required(),
  interestRate: Joi.number().min(0).max(100).required(),
  /** Percentage of loan principal (same unit as interestRate), not a fixed rupee amount */
  processingFee: Joi.number().min(0).max(100).required(),
  /** FLAT = flat interest+EMI; REDUCING = reducing-balance EMI (case-insensitive on input) */
  rateType: Joi.string()
    .trim()
    .uppercase()
    .valid(...RATE_TYPE_VALUES)
    .default(INTEREST_RATE_TYPES.FLAT)
});

export const updateInterestRateSchema = Joi.object({
  productCategory: Joi.string()
    .valid(...LOAN_PRODUCT_CATEGORIES)
    .optional(),
  interestRate: Joi.number().min(0).max(100).optional(),
  /** Percentage of loan principal, not a fixed rupee amount */
  processingFee: Joi.number().min(0).max(100).optional(),
  rateType: Joi.string().trim().uppercase().valid(...RATE_TYPE_VALUES).optional()
});
