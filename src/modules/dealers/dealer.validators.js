import Joi from "joi";

export const createDealerSchema = Joi.object({
  dealerName: Joi.string().min(2).max(200).required(),
  ownerName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(8).max(20).required(),
  email: Joi.string().email().required(),
  address: Joi.object({
    city: Joi.string().required(),
    state: Joi.string().required()
  }).required(),
  commissionRate: Joi.number().min(0).max(100).required()
});

export const updateDealerSchema = Joi.object({
  dealerName: Joi.string().min(2).max(200).optional(),
  ownerName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(8).max(20).optional(),
  email: Joi.string().email().optional(),
  address: Joi.object({
    city: Joi.string().optional(),
    state: Joi.string().optional()
  }).optional(),
  commissionRate: Joi.number().min(0).max(100).optional()
});

