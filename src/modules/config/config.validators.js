import Joi from "joi";

export const createConfigSchema = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object()).required(),
  description: Joi.string().max(500).optional()
});

export const updateConfigSchema = Joi.object({
  value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object()).required(),
  description: Joi.string().max(500).optional()
});
