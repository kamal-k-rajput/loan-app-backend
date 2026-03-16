import Joi from "joi";

export const createLenderSchema = Joi.object({
  lenderName: Joi.string().min(2).max(200).required(),
  contactPerson: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(8).max(20).required(),
  settlementAccount: Joi.string().required()
});

export const updateLenderSchema = Joi.object({
  lenderName: Joi.string().min(2).max(200).optional(),
  contactPerson: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().min(8).max(20).optional(),
  settlementAccount: Joi.string().optional()
});

