import Joi from "joi";

export const disburseLoanSchema = Joi.object({
  disbursedAmount: Joi.number().min(0).required(),
  disbursementDate: Joi.date().optional()
});
