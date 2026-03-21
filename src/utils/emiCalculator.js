import { INTEREST_RATE_TYPES } from "./constants.js";

/**
 * Reducing-balance EMI (same formula as EMI schedule generation).
 * P = principal, annual rate %, n = months
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1), r = annual/12/100
 */
export function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Stored/API value → calculation mode.
 * Accepts FLAT | REDUCING (canonical); legacy: flat, reducting, reducing (any case).
 */
export function normalizeInterestRateType(rateType) {
  if (rateType == null || rateType === "") {
    return INTEREST_RATE_TYPES.FLAT;
  }
  const u = String(rateType).toUpperCase();
  if (u === "REDUCING" || u === "REDUCTING") {
    return INTEREST_RATE_TYPES.REDUCING;
  }
  return INTEREST_RATE_TYPES.FLAT;
}

/**
 * Flat-rate EMI: total interest = P × (annual%/100) × (n/12), EMI = (P + totalInterest) / n
 */
export function calculateEmiFlat(principal, annualFlatRatePercent, tenureMonths) {
  const p = Number(principal) || 0;
  const n = Math.floor(Number(tenureMonths) || 0);
  if (n <= 0 || p <= 0) return 0;
  const R = Number(annualFlatRatePercent) || 0;
  const totalInterest = roundMoney((p * (R / 100) * n) / 12);
  return roundMoney((p + totalInterest) / n);
}

export function calculateEmiReducingBalance(principal, annualRatePercent, tenureMonths) {
  const p = Number(principal) || 0;
  const n = Math.floor(Number(tenureMonths) || 0);
  if (n <= 0 || p <= 0) return 0;

  const monthlyRate = Number(annualRatePercent) / 12 / 100;
  if (monthlyRate === 0) {
    return roundMoney(p / n);
  }
  const emi =
    (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  return roundMoney(emi);
}

/**
 * In-memory schedule (not persisted). Aligns with emi_schedule reducing-balance logic.
 * @returns {{ emiAmount: number, schedule: Array<object>, totalInterest: number, totalRepayment: number }}
 */
export function buildReducingBalanceSchedule(principal, annualRatePercent, tenureMonths) {
  const p = Number(principal) || 0;
  const n = Math.floor(Number(tenureMonths) || 0);
  if (n <= 0 || p <= 0) {
    return { emiAmount: 0, schedule: [], totalInterest: 0, totalRepayment: 0 };
  }

  const emiAmount = calculateEmiReducingBalance(p, annualRatePercent, n);
  const monthlyRate = Number(annualRatePercent) / 12 / 100;
  const schedule = [];
  let remainingPrincipal = p;

  for (let month = 1; month <= n; month++) {
    const interestComponent = roundMoney(remainingPrincipal * monthlyRate);
    let principalComponent = roundMoney(emiAmount - interestComponent);
    remainingPrincipal = roundMoney(remainingPrincipal - principalComponent);

    schedule.push({
      emiNumber: month,
      emiAmount,
      principalComponent,
      interestComponent,
      remainingPrincipal: Math.max(0, remainingPrincipal)
    });
  }

  if (schedule.length > 0) {
    const last = schedule[schedule.length - 1];
    const drift = last.remainingPrincipal;
    if (Math.abs(drift) > 0.001) {
      last.principalComponent = roundMoney(last.principalComponent + drift);
      last.remainingPrincipal = 0;
    }
  }

  const totalInterest = roundMoney(
    schedule.reduce((sum, row) => sum + row.interestComponent, 0)
  );
  const totalRepayment = roundMoney(
    schedule.reduce((sum, row) => sum + row.emiAmount, 0)
  );

  return { emiAmount, schedule, totalInterest, totalRepayment };
}

/**
 * Flat-rate schedule: equal interest share (totalInterest/n) each month; principal fills remainder of fixed EMI; last row absorbs rounding.
 * @returns {{ emiAmount: number, schedule: Array<object>, totalInterest: number, totalRepayment: number }}
 */
export function buildFlatRateSchedule(principal, annualFlatRatePercent, tenureMonths) {
  const p = Number(principal) || 0;
  const n = Math.floor(Number(tenureMonths) || 0);
  if (n <= 0 || p <= 0) {
    return { emiAmount: 0, schedule: [], totalInterest: 0, totalRepayment: 0 };
  }

  const R = Number(annualFlatRatePercent) || 0;
  const totalInterest = roundMoney((p * (R / 100) * n) / 12);
  const emiAmount = roundMoney((p + totalInterest) / n);
  const interestEach = roundMoney(totalInterest / n);

  const schedule = [];
  let remainingPrincipal = p;

  for (let month = 1; month <= n; month++) {
    const isLast = month === n;
    const interestComponent = isLast
      ? roundMoney(emiAmount - roundMoney(remainingPrincipal))
      : interestEach;
    const principalComponent = roundMoney(emiAmount - interestComponent);
    remainingPrincipal = roundMoney(remainingPrincipal - principalComponent);

    schedule.push({
      emiNumber: month,
      emiAmount,
      principalComponent,
      interestComponent,
      remainingPrincipal: Math.max(0, remainingPrincipal)
    });
  }

  if (schedule.length > 0) {
    const last = schedule[schedule.length - 1];
    const drift = last.remainingPrincipal;
    if (Math.abs(drift) > 0.001) {
      last.principalComponent = roundMoney(last.principalComponent + drift);
      last.interestComponent = roundMoney(emiAmount - last.principalComponent);
      last.remainingPrincipal = 0;
    }
  }

  const ti = roundMoney(schedule.reduce((sum, row) => sum + row.interestComponent, 0));
  const totalRepayment = roundMoney(schedule.reduce((sum, row) => sum + row.emiAmount, 0));

  return { emiAmount, schedule, totalInterest: ti, totalRepayment };
}
