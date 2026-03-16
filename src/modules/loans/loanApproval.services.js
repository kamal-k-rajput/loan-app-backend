import {
  updateLoanStatus,
  createLoanContract,
  getPendingLoanApprovals,
  getLoanApplicationById
} from "./loanApproval.repositories.js";
import { LOAN_APPLICATION_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

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

  // Create loan contract
  const contract = await createLoanContract(db, session, {
    loanApplicationId: new ObjectId(loanId),
    customerId: loan.customerId,
    dealerId: loan.dealerId,
    lenderId: new ObjectId(lenderId),
    principalAmount: loan.loanAmount,
    interestRate: payload.interestRate,
    tenureMonths: loan.tenure,
    processingFee: payload.processingFee || 0,
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
