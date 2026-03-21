import Joi from "joi";

/** Real-time EMI preview: loads interest_rates by rateId only; nothing persisted */
export const calculateEmiPreviewSchema = Joi.object({
  loanAmount: Joi.number().min(1).required(),
  tenureMonths: Joi.number().integer().min(1).max(120).required(),
  rateId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
});
