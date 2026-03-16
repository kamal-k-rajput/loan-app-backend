import Joi from "joi";

export const uploadKycSchema = Joi.object({
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  documentType: Joi.string().valid("AADHAR", "PAN", "BANK_STATEMENT", "ADDRESS_PROOF").required(),
  fileUrl: Joi.string().uri().required()
});

export const verifyKycSchema = Joi.object({
  remarks: Joi.string().max(500).optional()
});

export const rejectKycSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required()
});

export const panVerifySchema = Joi.object({
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  panNumber: Joi.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required()
});

export const aadharVerifySchema = Joi.object({
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  aadharNumber: Joi.string().regex(/^[0-9]{12}$/).required()
});
