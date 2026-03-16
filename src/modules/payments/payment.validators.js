import Joi from "joi";
import { PAYMENT_MODES } from "../../utils/constants.js";

export const payEmiSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  paymentMode: Joi.string()
    .valid(...Object.values(PAYMENT_MODES))
    .required(),
  transactionId: Joi.string().optional()
});

export const createPaymentSchema = Joi.object({
  loanId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  emiId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  amount: Joi.number().min(0).required(),
  paymentMode: Joi.string()
    .valid(...Object.values(PAYMENT_MODES))
    .required(),
  transactionId: Joi.string().optional()
});

export const razorpayCreateOrderSchema = Joi.object({
  emiId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  amount: Joi.number().min(0).required()
});

export const razorpayWebhookSchema = Joi.object({
  event: Joi.string().required(),
  payload: Joi.object().required()
});

export const razorpayVerifySchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
});
