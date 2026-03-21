import {
  getLoanContractByApplicationId,
  createEmiSchedule,
  getEmiScheduleByLoanId,
  listEmis,
  getEmiById
} from "./emi.repositories.js";
import { EMI_STATUS, LOAN_CONTRACT_STATUS, ROLES } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

/** Unpaid EMI statuses (dealer “pending” collection view). */
const DEALER_PENDING_EMI_STATUSES = [
  EMI_STATUS.PENDING,
  EMI_STATUS.OVERDUE,
  EMI_STATUS.PARTIAL
];

/**
 * Calendar month bounds in local server timezone.
 * @param {number} monthsOffset 0 = current month, -1 = previous month
 */
function getCalendarMonthBounds(monthsOffset = 0) {
  const ref = new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth() + monthsOffset;
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Calculate EMI using reducing balance method
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * Where:
 * P = Principal
 * r = Monthly interest rate (annual rate / 12 / 100)
 * n = Number of months
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate EMI schedule for a loan
 */
export async function generateEmiScheduleService(db, session, loanId) {
  // Get loan contract
  const contract = await getLoanContractByApplicationId(db, session, loanId);
  if (!contract) {
    throw new Error("LOAN_CONTRACT_NOT_FOUND");
  }

  if (contract.loanStatus !== LOAN_CONTRACT_STATUS.DISBURSED) {
    throw new Error("LOAN_NOT_DISBURSED");
  }

  // Check if EMI schedule already exists
  const existingSchedule = await getEmiScheduleByLoanId(db, session, loanId);
  if (existingSchedule && existingSchedule.length > 0) {
    throw new Error("EMI_SCHEDULE_ALREADY_EXISTS");
  }

  const principal = contract.principalAmount;
  const annualRate = contract.interestRate;
  const tenureMonths = contract.tenureMonths;
  const emiAmount = calculateEMI(principal, annualRate, tenureMonths);

  // Generate EMI schedule
  const emiRecords = [];
  let remainingPrincipal = principal;
  const disbursementDate = contract.disbursementDate || new Date();
  const startDate = new Date(disbursementDate);

  for (let month = 1; month <= tenureMonths; month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + month);

    const monthlyRate = annualRate / 12 / 100;
    const interestComponent = remainingPrincipal * monthlyRate;
    const principalComponent = emiAmount - interestComponent;
    remainingPrincipal = remainingPrincipal - principalComponent;

    // Round to 2 decimal places
    const interest = Math.round(interestComponent * 100) / 100;
    const principalComp = Math.round(principalComponent * 100) / 100;
    const remaining = Math.max(0, Math.round(remainingPrincipal * 100) / 100);

    emiRecords.push({
      loanId: new ObjectId(loanId),
      contractId: contract._id,
      emiNumber: month,
      dueDate,
      emiAmount: Math.round(emiAmount * 100) / 100,
      principalComponent: principalComp,
      interestComponent: interest,
      remainingPrincipal: remaining,
      status: EMI_STATUS.PENDING,
      createdAt: new Date()
    });
  }

  // Adjust last EMI to account for rounding differences
  if (emiRecords.length > 0) {
    const lastEmi = emiRecords[emiRecords.length - 1];
    lastEmi.remainingPrincipal = 0;
    lastEmi.principalComponent = lastEmi.remainingPrincipal + lastEmi.principalComponent;
  }

  await createEmiSchedule(db, session, emiRecords);

  return {
    loanId,
    contractId: contract._id.toString(),
    emiAmount: Math.round(emiAmount * 100) / 100,
    totalEmis: tenureMonths,
    schedule: emiRecords.map((e) => ({
      ...e,
      id: e._id.toString(),
      loanId: e.loanId.toString(),
      contractId: e.contractId.toString()
    }))
  };
}

export async function getEmiScheduleByLoanService(db, session, loanId) {
  const schedule = await getEmiScheduleByLoanId(db, session, loanId);
  return schedule.map((e) => ({
    ...e,
    id: e._id.toString(),
    loanId: e.loanId ? e.loanId.toString() : null,
    contractId: e.contractId ? e.contractId.toString() : null
  }));
}

/**
 * @param {{ pendingDueMonth?: 'current' | 'previous' | 'all' }} options
 * For DEALER only: filters list to unpaid EMIs; `pendingDueMonth` defaults to `current` (due in current calendar month).
 */
export async function listEmisService(db, session, user, options = {}) {
  let filter = {};

  if (user.role === ROLES.DEALER && user.dealerId) {
    // Get loans for this dealer, then filter EMIs
    const loans = await db
      .collection("loan_applications")
      .find({ dealerId: new ObjectId(user.dealerId) }, { session })
      .toArray();
    const loanIds = loans.map((l) => l._id);
    filter.loanId = { $in: loanIds.map((id) => new ObjectId(id)) };

    const pendingDueMonth = options.pendingDueMonth || "current";
    filter.status = { $in: DEALER_PENDING_EMI_STATUSES };

    if (pendingDueMonth === "current") {
      const { start, end } = getCalendarMonthBounds(0);
      filter.dueDate = { $gte: start, $lte: end };
    } else if (pendingDueMonth === "previous") {
      const { start, end } = getCalendarMonthBounds(-1);
      filter.dueDate = { $gte: start, $lte: end };
    } else if (pendingDueMonth === "all") {
      // unpaid only, any due date
    } else {
      throw new Error("INVALID_PENDING_DUE_MONTH");
    }
  } else if (user.role === ROLES.LENDER && user.lenderId) {
    // Get contracts for this lender, then filter EMIs
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const contractIds = contracts.map((c) => c._id);
    filter.contractId = { $in: contractIds.map((id) => new ObjectId(id)) };
  }

  const emis = await listEmis(db, session, filter);
  return emis.map((e) => ({
    ...e,
    id: e._id.toString(),
    loanId: e.loanId ? e.loanId.toString() : null,
    contractId: e.contractId ? e.contractId.toString() : null
  }));
}

export async function getEmiService(db, session, emiId) {
  const emi = await getEmiById(db, session, emiId);
  if (!emi) return null;
  return {
    ...emi,
    id: emi._id.toString(),
    loanId: emi.loanId ? emi.loanId.toString() : null,
    contractId: emi.contractId ? emi.contractId.toString() : null
  };
}
