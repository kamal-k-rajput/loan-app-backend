import Joi from "joi";

export const applyLoanSchema = Joi.object({
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  loanAmount: Joi.number().min(0).required(),
  tenure: Joi.number().min(1).max(120).required()
});

export const updateLoanSchema = Joi.object({
  loanAmount: Joi.number().min(0).optional(),
  tenure: Joi.number().min(1).max(120).optional()
});
