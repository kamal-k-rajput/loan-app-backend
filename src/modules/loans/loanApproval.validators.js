import Joi from "joi";

export const approveLoanSchema = Joi.object({
  remarks: Joi.string().max(500).optional(),
  interestRate: Joi.number().min(0).max(100).required(),
  /** Optional override: % of loan principal. If omitted, taken from lender interest_rates for this product category */
  processingFee: Joi.number().min(0).max(100).optional()
});

export const rejectLoanSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required()
});
