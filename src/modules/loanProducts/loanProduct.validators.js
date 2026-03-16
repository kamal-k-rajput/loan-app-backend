import Joi from "joi";

export const createLoanProductSchema = Joi.object({
  productName: Joi.string().min(2).max(200).required(),
  category: Joi.string().valid("AUTO", "BATTERY", "PERSONAL").required(),
  minAmount: Joi.number().min(0).required(),
  maxAmount: Joi.number().min(0).required(),
  minTenure: Joi.number().min(1).max(120).required(),
  maxTenure: Joi.number().min(1).max(120).required()
});

export const updateLoanProductSchema = Joi.object({
  productName: Joi.string().min(2).max(200).optional(),
  category: Joi.string().valid("AUTO", "BATTERY", "PERSONAL").optional(),
  minAmount: Joi.number().min(0).optional(),
  maxAmount: Joi.number().min(0).optional(),
  minTenure: Joi.number().min(1).max(120).optional(),
  maxTenure: Joi.number().min(1).max(120).optional()
});
