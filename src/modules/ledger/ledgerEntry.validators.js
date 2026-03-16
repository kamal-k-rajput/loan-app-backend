import Joi from "joi";
import { LEDGER_ACCOUNT_TYPES, LEDGER_TRANSACTION_TYPES } from "../../utils/constants.js";

const transactionSchema = Joi.object({
  accountId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  type: Joi.string()
    .valid(...Object.values(LEDGER_TRANSACTION_TYPES))
    .required(),
  amount: Joi.number().min(0).required()
});

export const createLedgerEntrySchema = Joi.object({
  referenceType: Joi.string().valid("loan", "payment", "disbursement", "collection", "prepayment").required(),
  referenceId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  description: Joi.string().min(1).max(500).required(),
  transactions: Joi.array()
    .items(transactionSchema)
    .min(2)
    .required()
    .custom((value, helpers) => {
      // Validate double-entry: total debits = total credits
      const debits = value.filter((t) => t.type === LEDGER_TRANSACTION_TYPES.DEBIT);
      const credits = value.filter((t) => t.type === LEDGER_TRANSACTION_TYPES.CREDIT);
      const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
      const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return helpers.error("any.custom", {
          message: "DEBIT_AND_CREDIT_MUST_BALANCE"
        });
      }
      return value;
    })
});
