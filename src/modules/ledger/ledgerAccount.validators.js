import Joi from "joi";
import { LEDGER_ACCOUNT_TYPES } from "../../utils/constants.js";

export const createLedgerAccountSchema = Joi.object({
  accountName: Joi.string().min(1).max(200).required(),
  accountType: Joi.string()
    .valid(...Object.values(LEDGER_ACCOUNT_TYPES))
    .required(),
  ownerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  ownerType: Joi.string().valid("customer", "lender", "dealer", "system").optional()
});
