import { updateLoanStatus, getLoanApplicationById } from "./loanApproval.repositories.js";
import { LOAN_APPLICATION_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

/**
 * Move loan to UNDER_REVIEW status and optionally assign a lender
 */
export async function moveLoanToReviewService(db, session, loanId, lenderId = null) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  // Only allow moving from APPLIED or KYC_PENDING to UNDER_REVIEW
  const allowedStatuses = [
    LOAN_APPLICATION_STATUS.APPLIED,
    LOAN_APPLICATION_STATUS.KYC_PENDING
  ];

  if (!allowedStatuses.includes(loan.status)) {
    throw new Error("LOAN_CANNOT_BE_MOVED_TO_REVIEW");
  }

  const updateData = {
    status: LOAN_APPLICATION_STATUS.UNDER_REVIEW,
    movedToReviewAt: new Date()
  };

  // If lenderId provided, assign lender
  if (lenderId) {
    updateData.lenderAssigned = new ObjectId(lenderId);
    updateData.assignedAt = new Date();
  }

  await updateLoanStatus(db, session, loanId, LOAN_APPLICATION_STATUS.UNDER_REVIEW, updateData);

  return {
    loanId: loan._id.toString(),
    status: LOAN_APPLICATION_STATUS.UNDER_REVIEW,
    lenderAssigned: lenderId || null
  };
}

/**
 * Assign a lender to a loan that's already in UNDER_REVIEW
 */
export async function assignLenderToLoanService(db, session, loanId, lenderId) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  // Only allow assignment if loan is in UNDER_REVIEW
  if (loan.status !== LOAN_APPLICATION_STATUS.UNDER_REVIEW) {
    throw new Error("LOAN_MUST_BE_IN_UNDER_REVIEW_TO_ASSIGN_LENDER");
  }

  // Check if lender already assigned
  if (loan.lenderAssigned) {
    throw new Error("LENDER_ALREADY_ASSIGNED");
  }

  await updateLoanStatus(db, session, loanId, LOAN_APPLICATION_STATUS.UNDER_REVIEW, {
    lenderAssigned: new ObjectId(lenderId),
    assignedAt: new Date()
  });

  return {
    loanId: loan._id.toString(),
    lenderAssigned: lenderId,
    status: loan.status
  };
}
