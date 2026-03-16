import Joi from "joi";

export const assignLenderSchema = Joi.object({
  lenderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
});

export const moveToReviewSchema = Joi.object({
  lenderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});
