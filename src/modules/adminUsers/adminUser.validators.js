import Joi from "joi";
import { ROLES } from "../../utils/constants.js";

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(8).max(20).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid(ROLES.ADMIN, ROLES.LENDER, ROLES.DEALER)
    .required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(8).max(20).optional()
});


