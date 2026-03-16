import Joi from "joi";
import { COLLECTION_STATUS } from "../../utils/constants.js";

export const recordCollectionSchema = Joi.object({
  loanId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  emiId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  amountCollected: Joi.number().min(0).required()
});

export const approveCollectionSchema = Joi.object({
  remarks: Joi.string().max(500).optional()
});

export const rejectCollectionSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required()
});
