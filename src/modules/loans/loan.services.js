import {
  createLoanApplication,
  listLoanApplications,
  getLoanApplicationById,
  updateLoanApplication,
  deleteLoanApplication,
  getLoanApplicationsByStatus
} from "./loan.repositories.js";
import { LOAN_APPLICATION_STATUS } from "../../utils/constants.js";
import { ObjectId } from "mongodb";

export async function applyLoanService(db, session, payload, dealerId) {
  const { customerId, productId, loanAmount, tenure } = payload;

  // Verify customer exists and belongs to dealer
  const customer = await db.collection("customers").findOne(
    {
      _id: new ObjectId(customerId),
      createdByDealer: new ObjectId(dealerId)
    },
    { session }
  );

  if (!customer) {
    throw new Error("CUSTOMER_NOT_FOUND_OR_NOT_ACCESSIBLE");
  }

  // Verify product exists
  const product = await db.collection("loan_products").findOne(
    { _id: new ObjectId(productId) },
    { session }
  );

  if (!product) {
    throw new Error("LOAN_PRODUCT_NOT_FOUND");
  }

  // Validate loan amount and tenure against product limits
  if (loanAmount < product.minAmount || loanAmount > product.maxAmount) {
    throw new Error("LOAN_AMOUNT_OUT_OF_RANGE");
  }

  if (tenure < product.minTenure || tenure > product.maxTenure) {
    throw new Error("TENURE_OUT_OF_RANGE");
  }

  // Check customer KYC status
  let initialStatus = LOAN_APPLICATION_STATUS.APPLIED;
  if (customer.kycStatus === "PENDING" || !customer.kycStatus) {
    initialStatus = LOAN_APPLICATION_STATUS.KYC_PENDING;
  }

  const doc = {
    customerId: new ObjectId(customerId),
    dealerId: new ObjectId(dealerId),
    productId: new ObjectId(productId),
    loanAmount,
    tenure,
    status: initialStatus
  };

  const loan = await createLoanApplication(db, session, doc);
  return { ...loan, id: loan._id.toString() };
}

export async function listLoansService(db, session, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    filter.dealerId = new ObjectId(user.dealerId);
  } else if (user.role === "LENDER" && user.lenderId) {
    // Lenders see loans assigned to them (after approval)
    filter.lenderAssigned = new ObjectId(user.lenderId);
  }
  // ADMIN sees all loans (no filter)

  const loans = await listLoanApplications(db, session, filter);
  return loans.map((l) => ({
    ...l,
    id: l._id.toString(),
    customerId: l.customerId ? l.customerId.toString() : null,
    dealerId: l.dealerId ? l.dealerId.toString() : null,
    productId: l.productId ? l.productId.toString() : null,
    lenderAssigned: l.lenderAssigned ? l.lenderAssigned.toString() : null
  }));
}

export async function getLoanService(db, session, loanId) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) return null;
  return {
    ...loan,
    id: loan._id.toString(),
    customerId: loan.customerId ? loan.customerId.toString() : null,
    dealerId: loan.dealerId ? loan.dealerId.toString() : null,
    productId: loan.productId ? loan.productId.toString() : null,
    lenderAssigned: loan.lenderAssigned ? loan.lenderAssigned.toString() : null
  };
}

export async function updateLoanService(db, session, loanId, updates, user) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  // Only allow updates if loan is in early stages
  const allowedStatuses = [
    LOAN_APPLICATION_STATUS.APPLIED,
    LOAN_APPLICATION_STATUS.KYC_PENDING,
    LOAN_APPLICATION_STATUS.UNDER_REVIEW
  ];

  if (!allowedStatuses.includes(loan.status)) {
    throw new Error("LOAN_CANNOT_BE_UPDATED");
  }

  // Dealers can only update their own loans
  if (user.role === "DEALER" && loan.dealerId.toString() !== user.dealerId) {
    throw new Error("CANNOT_UPDATE_OTHER_DEALER_LOAN");
  }

  const updated = await updateLoanApplication(db, session, loanId, updates);
  return {
    ...updated,
    id: updated._id.toString(),
    customerId: updated.customerId ? updated.customerId.toString() : null,
    dealerId: updated.dealerId ? updated.dealerId.toString() : null,
    productId: updated.productId ? updated.productId.toString() : null,
    lenderAssigned: updated.lenderAssigned ? updated.lenderAssigned.toString() : null
  };
}

export async function cancelLoanService(db, session, loanId, user) {
  const loan = await getLoanApplicationById(db, session, loanId);
  if (!loan) {
    throw new Error("LOAN_NOT_FOUND");
  }

  // Only allow cancellation if loan is not disbursed
  if (loan.status === LOAN_APPLICATION_STATUS.DISBURSED) {
    throw new Error("DISBURSED_LOAN_CANNOT_BE_CANCELLED");
  }

  // Dealers can only cancel their own loans
  if (user.role === "DEALER" && loan.dealerId.toString() !== user.dealerId) {
    throw new Error("CANNOT_CANCEL_OTHER_DEALER_LOAN");
  }

  return deleteLoanApplication(db, session, loanId);
}

export async function getLoansByStatusService(db, session, status, user) {
  let filter = {};
  
  if (user.role === "DEALER" && user.dealerId) {
    filter.dealerId = new ObjectId(user.dealerId);
  } else if (user.role === "LENDER" && user.lenderId) {
    filter.lenderAssigned = new ObjectId(user.lenderId);
  }
  
  const loans = await getLoanApplicationsByStatus(db, session, status, filter);
  
  return loans.map((l) => ({
    ...l,
    id: l._id.toString(),
    customerId: l.customerId ? l.customerId.toString() : null,
    dealerId: l.dealerId ? l.dealerId.toString() : null,
    productId: l.productId ? l.productId.toString() : null,
    lenderAssigned: l.lenderAssigned ? l.lenderAssigned.toString() : null
  }));
}
