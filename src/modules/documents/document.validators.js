import Joi from "joi";

export const uploadDocumentSchema = Joi.object({
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  loanId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  documentType: Joi.string()
    .valid("AADHAR", "PAN", "BANK_STATEMENT", "ADDRESS_PROOF", "LOAN_AGREEMENT", "OTHER")
    .required(),
  fileUrl: Joi.string().uri().required(),
  fileName: Joi.string().max(200).optional(),
  fileSize: Joi.number().min(0).optional()
});
