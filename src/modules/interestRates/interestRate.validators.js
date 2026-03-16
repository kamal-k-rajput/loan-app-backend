import Joi from "joi";

export const createInterestRateSchema = Joi.object({
  lenderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  productCategory: Joi.string().valid("AUTO", "BATTERY", "PERSONAL").required(),
  interestRate: Joi.number().min(0).max(100).required(),
  processingFee: Joi.number().min(0).required()
});

export const updateInterestRateSchema = Joi.object({
  productCategory: Joi.string().valid("AUTO", "BATTERY", "PERSONAL").optional(),
  interestRate: Joi.number().min(0).max(100).optional(),
  processingFee: Joi.number().min(0).optional()
});
