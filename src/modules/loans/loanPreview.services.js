import { getInterestRateById } from "../interestRates/interestRate.repositories.js";
import {
  buildReducingBalanceSchedule,
  buildFlatRateSchedule,
  normalizeInterestRateType,
  roundMoney
} from "../../utils/emiCalculator.js";
import { INTEREST_RATE_TYPES } from "../../utils/constants.js";

/**
 * Preview EMI from selected interest_rates row (by rateId). No DB writes.
 */
export async function calculateEmiPreviewService(db, session, payload) {
  const { loanAmount, tenureMonths, rateId } = payload;

  const rate = await getInterestRateById(db, session, rateId);
  if (!rate) {
    throw new Error("INTEREST_RATE_NOT_FOUND");
  }

  const interestRatePercent = Number(rate.interestRate) || 0;
  const processingFeePercent = Number(rate.processingFee) || 0;
  const rateType = normalizeInterestRateType(rate.rateType);

  const processingFeeAmount = roundMoney((loanAmount * processingFeePercent) / 100);

  const built =
    rateType === INTEREST_RATE_TYPES.REDUCING
      ? buildReducingBalanceSchedule(loanAmount, interestRatePercent, tenureMonths)
      : buildFlatRateSchedule(loanAmount, interestRatePercent, tenureMonths);
  const { emiAmount, schedule, totalInterest, totalRepayment } = built;

  return {
    preview: true,
    rateId,
    rate: {
      id: rate._id.toString(),
      productCategory: rate.productCategory,
      interestRatePercent,
      processingFeePercent,
      rateType
    },
    inputs: {
      loanAmount,
      tenureMonths
    },
    processingFeeAmount,
    /** If file charge is deducted at disbursement (typical) */
    estimatedNetDisbursement: roundMoney(loanAmount - processingFeeAmount),
    monthlyEmi: emiAmount,
    totalEmis: tenureMonths,
    totalInterestPayable: totalInterest,
    totalRepayment,
    schedule
  };
}
