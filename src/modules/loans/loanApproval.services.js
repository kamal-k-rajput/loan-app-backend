import {
  updateLoanStatus,
  createLoanContract,
  getPendingLoanApprovals,
  getLoanApplicationById
} from "./loanApproval.repositories.js";
import { getInterestRatesByLender } from "../interestRates/interestRate.repositories.js";
import { LOAN_APPLICATION_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** processingFeePercent is % of principal; returns rupee amount */
function processingFeeAmountFromPercent(principal, processingFeePercent) {
  const p = Number(principal) || 0;
  const pc = Number(processingFeePercent) || 0;
  if (p <= 0 || pc <= 0) return 0;
  return roundMoney((p * pc) / 100);
}

async function resolveProcessingFeePercent(db, session, lenderId, loan, payload) {
  if (payload.processingFee != null && payload.processingFee !== "") {
    return Number(payload.processingFee);
  }
  if (!loan.productId) return 0;
  const product = await db.collection("loan_products").findOne(
    { _id: loan.productId },
    { session, projection: { category: 1 } }
  );
  if (!product?.category) return 0;
  const rates = await getInterestRatesByLender(db, session, lenderId);
  const match = rates.find((r) => r.productCategory === product.category);
  return match?.processingFee != null ? Number(match.processingFee) : 0;
}

export async function approveLoanService(db, session, loanId, lenderId, payload) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  if (loan.status !== LOAN_APPLICATION_STATUS.UNDER_REVIEW) {
    throw new Error("LOAN_NOT_IN_REVIEW");
  }

  // If loan has no lender assigned, assign the approving lender
  // If loan has a lender assigned, only that lender can approve
  if (loan.lenderAssigned) {
    if (loan.lenderAssigned.toString() !== lenderId) {
      throw new Error("LOAN_ALREADY_ASSIGNED_TO_ANOTHER_LENDER");
    }
  }

  // Update loan application status
  await updateLoanStatus(
    db,
    session,
    loanId,
    LOAN_APPLICATION_STATUS.APPROVED,
    {
      lenderAssigned: new ObjectId(lenderId),
      approvedAt: new Date(),
      approvedBy: new ObjectId(lenderId),
      remarks: payload.remarks
    }
  );

  const principalAmount = loan.loanAmount;
  const processingFeePercent = await resolveProcessingFeePercent(
    db,
    session,
    lenderId,
    loan,
    payload
  );
  const processingFeeAmount = processingFeeAmountFromPercent(
    principalAmount,
    processingFeePercent
  );

  // Create loan contract (processingFee = rupees; processingFeePercent = % used)
  const contract = await createLoanContract(db, session, {
    loanApplicationId: new ObjectId(loanId),
    customerId: loan.customerId,
    dealerId: loan.dealerId,
    lenderId: new ObjectId(lenderId),
    principalAmount,
    interestRate: payload.interestRate,
    tenureMonths: loan.tenure,
    processingFee: processingFeeAmount,
    processingFeePercent,
    disbursedAmount: 0,
    disbursementDate: null
  });

  return {
    loanId: loan._id.toString(),
    contractId: contract._id.toString(),
    status: LOAN_APPLICATION_STATUS.APPROVED
  };
}

export async function rejectLoanService(db, session, loanId, lenderId, reason) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  if (loan.status !== LOAN_APPLICATION_STATUS.UNDER_REVIEW) {
    throw new Error("LOAN_NOT_IN_REVIEW");
  }

  await updateLoanStatus(
    db,
    session,
    loanId,
    LOAN_APPLICATION_STATUS.REJECTED,
    {
      lenderAssigned: new ObjectId(lenderId),
      rejectedAt: new Date(),
      rejectedBy: new ObjectId(lenderId),
      rejectionReason: reason
    }
  );

  return {
    loanId: loan._id.toString(),
    status: LOAN_APPLICATION_STATUS.REJECTED,
    reason
  };
}

export async function getPendingLoanApprovalsService(db, session, lenderId) {
  const loans = await getPendingLoanApprovals(db, session, lenderId);
  return loans.map((l) => ({
    ...l,
    id: l._id.toString(),
    customerId: l.customerId ? l.customerId.toString() : null,
    dealerId: l.dealerId ? l.dealerId.toString() : null,
    productId: l.productId ? l.productId.toString() : null,
    lenderAssigned: l.lenderAssigned ? l.lenderAssigned.toString() : null
  }));
}
