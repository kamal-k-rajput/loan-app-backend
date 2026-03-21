import Joi from "joi";

export const createInterestRateSchema = Joi.object({
  lenderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  productCategory: Joi.string().valid("AUTO", "BATTERY", "PERSONAL").required(),
  interestRate: Joi.number().min(0).max(100).required(),
  /** Percentage of loan principal (same unit as interestRate), not a fixed rupee amount */
  processingFee: Joi.number().min(0).max(100).required()
});

export const updateInterestRateSchema = Joi.object({
  productCategory: Joi.string().valid("AUTO", "BATTERY", "PERSONAL").optional(),
  interestRate: Joi.number().min(0).max(100).optional(),
  /** Percentage of loan principal, not a fixed rupee amount */
  processingFee: Joi.number().min(0).max(100).optional()
});
