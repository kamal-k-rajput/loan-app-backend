import Joi from "joi";

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  phone: Joi.string().min(8).max(20).required(),
  email: Joi.string().email().optional(),
  dob: Joi.date().optional(),
  address: Joi.object({
    line1: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required()
  }).required()
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  phone: Joi.string().min(8).max(20).optional(),
  email: Joi.string().email().optional(),
  dob: Joi.date().optional(),
  address: Joi.object({
    line1: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional()
  }).optional()
});

