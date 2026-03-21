import {
  getLoanContractByApplicationId,
  createEmiSchedule,
  getEmiScheduleByLoanId,
  listEmis,
  getEmiById
} from "./emi.repositories.js";
import {
  EMI_STATUS,
  INTEREST_RATE_TYPES,
  LOAN_CONTRACT_STATUS,
  ROLES
} from "../../utils/constants.js";
import {
  buildReducingBalanceSchedule,
  buildFlatRateSchedule,
  normalizeInterestRateType
} from "../../utils/emiCalculator.js";
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
  const rateType = normalizeInterestRateType(contract.rateType);
  const scheduleBuilt =
    rateType === INTEREST_RATE_TYPES.REDUCING
      ? buildReducingBalanceSchedule(principal, annualRate, tenureMonths)
      : buildFlatRateSchedule(principal, annualRate, tenureMonths);
  const { emiAmount, schedule: planRows } = scheduleBuilt;

  // Generate EMI schedule
  const emiRecords = [];
  const disbursementDate = contract.disbursementDate || new Date();
  const startDate = new Date(disbursementDate);

  for (let month = 1; month <= tenureMonths; month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + month);

    const row = planRows[month - 1];
    const interest = row.interestComponent;
    const principalComp = row.principalComponent;
    const remaining = row.remainingPrincipal;

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
