import Joi from "joi";

export const prepaymentSchema = Joi.object({
  prepaymentAmount: Joi.number().min(0).required(),
  paymentMode: Joi.string().valid("RAZORPAY", "UPI", "CASH", "BANK").optional()
});
